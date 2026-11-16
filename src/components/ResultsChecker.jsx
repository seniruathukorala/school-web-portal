import React, { useState } from 'react';
import { client } from '../sanityClient';
import * as XLSX from 'xlsx';

export default function ResultsChecker() {
  const [indexNo, setIndexNo] = useState('');
  const [dob, setDob] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [loading, setLoading] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [studentMeta, setStudentMeta] = useState({ name: '', classSection: '' });
  const [summaryStats, setSummaryStats] = useState({ total: 0, average: 0, rank: '-' });
  const [error, setError] = useState('');

  const handlePrint = () => {
    window.print();
  };

  // Spaces saha symbols ain karala clean key eka ganna helper eka
  const normalizeKey = (key) => String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const SYSTEM_IGNORED_KEYS = [
    'studentname', 'name', 'nama', 'indexno', 'index', 'admissionno', 'athulathankaya',
    'dob', 'dateofbirth', 'birthday', 'upandinaya',
    'grade', 'term', 'section', 'class', 'classsection',
    'rownum', 'total', 'average', 'rank', 'place',
    'numerictotal', 'avg', '__total', '__numerictotal', '__avg', '__rank'
  ];

  // Grade anuwa expected subjects gaana (Junior = 11, O/L = 9, A/L = 3)
  const getExpectedSubjectCount = (gradeStr) => {
    const num = parseInt(String(gradeStr).replace(/\D/g, ''), 10);
    if (num >= 6 && num <= 9) return 11;
    if (num >= 10 && num <= 11) return 9;
    if (num >= 12 && num <= 13) return 3;
    return 9;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!indexNo.trim() || !dob) {
      setError('Please enter both Index Number and Date of Birth.');
      return;
    }

    setLoading(true);
    setError('');
    setStudentResult(null);

    try {
      const numGrade = selectedGrade.replace(/\D/g, '').trim();

      // 1. Adala Grade saha Term ekata thiyena SIYALUMA sections wala sheets gannawa
      const query = `*[_type == "resultSheet" && lower(term) == lower($term) && (
        grade == $grade || grade == $shortGrade || grade == $pureGrade
      )]{
        title,
        classSection,
        "fileUrl": file.asset->url
      }`;

      const sheets = await client.fetch(query, {
        grade: selectedGrade,
        shortGrade: `Grade ${numGrade}`,
        pureGrade: numGrade,
        term: selectedTerm
      });

      if (!sheets || sheets.length === 0) {
        setError(`No result sheet uploaded for ${selectedGrade} ${selectedTerm} yet.`);
        setLoading(false);
        return;
      }

      const targetIndex = indexNo.trim().toLowerCase();
      const targetDob = dob.trim();

      let matchedStudent = null;
      let matchedSheetData = null;
      let matchedSection = '';

      // 2. Hamoma class sheets check karala Index No + DOB match wena lamaya hoyagannawa
      for (const sheet of sheets) {
        if (!sheet.fileUrl) continue;

        const response = await fetch(sheet.fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const found = jsonData.find((row) => {
          let fileIndex = '';
          let fileDob = '';

          Object.keys(row).forEach((k) => {
            const cleanK = normalizeKey(k);
            if (['indexno', 'index', 'admissionno', 'athulathankaya'].includes(cleanK)) {
              fileIndex = String(row[k]).trim().toLowerCase();
            }
            if (['dob', 'dateofbirth', 'birthday', 'upandinaya'].includes(cleanK)) {
              fileDob = String(row[k]).trim();
            }
          });

          return fileIndex === targetIndex && fileDob === targetDob;
        });

        if (found) {
          matchedStudent = found;
          matchedSheetData = jsonData;
          matchedSection = sheet.classSection || '';
          break;
        }
      }

      if (matchedStudent && matchedSheetData) {
        // Student Name saha Subject marks wen karagannawa
        let sName = '';
        const cleanSubjects = {};

        Object.entries(matchedStudent).forEach(([k, v]) => {
          const cleanK = normalizeKey(k);
          if (['studentname', 'name', 'nama'].includes(cleanK)) {
            sName = String(v).trim();
          } else if (!SYSTEM_IGNORED_KEYS.includes(cleanK)) {
            // Empty columns (e.g. anith lamayinge basket subjects) ain karanawa
            if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '-') {
              cleanSubjects[k] = v;
            }
          }
        });

        setStudentMeta({ name: sName, classSection: matchedSection });
        setStudentResult(cleanSubjects);

        // 3. Class Rank calculation ('Ab' = 0 lesa ganan gannawa, Index No ekathu wenne na)
        const studentTotals = matchedSheetData.map((row) => {
          let rIndex = '';
          let rowTot = 0;

          Object.entries(row).forEach(([k, v]) => {
            const cleanK = normalizeKey(k);
            if (['indexno', 'index', 'admissionno', 'athulathankaya'].includes(cleanK)) {
              rIndex = String(v).trim().toLowerCase();
            } else if (!SYSTEM_IGNORED_KEYS.includes(cleanK)) {
              const valStr = String(v).trim().toLowerCase();
              if (valStr !== '' && valStr !== 'ab') {
                const num = Number(valStr);
                if (!isNaN(num)) rowTot += num;
              }
            }
          });

          return { index: rIndex, total: rowTot };
        });

        // Unique totals walin rank eka hadanawa (Same total thibboth same rank)
        const sortedTotals = [...new Set(studentTotals.map(item => item.total))].sort((a, b) => b - a);
        const currentStudentRecord = studentTotals.find(item => item.index === targetIndex);
        const curTotal = currentStudentRecord ? currentStudentRecord.total : 0;
        const place = sortedTotals.indexOf(curTotal) + 1;

        // 4. Average calculation (Junior = 11, O/L = 9, 'Ab' count wenawa)
        const subjectEntries = Object.entries(cleanSubjects);
        const expectedCount = getExpectedSubjectCount(selectedGrade);
        const divisor = subjectEntries.length > 0
          ? Math.min(subjectEntries.length, expectedCount)
          : expectedCount;

        const curAverage = divisor > 0 ? (curTotal / divisor).toFixed(2) : '0.00';

        setSummaryStats({
          total: curTotal,
          average: curAverage,
          rank: place > 0 ? `#${place}` : '-'
        });
      } else {
        setError('Invalid Index Number or Date of Birth. Please check and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '30px auto', padding: '30px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: flex !important; }
          body { background: #fff !important; }
          #printable-report { border: none !important; padding: 0 !important; }
        }
      `}</style>

      {/* Search Section */}
      <div className="no-print">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', marginBottom: '6px' }}>Student Examination Portal</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Enter your Index Number & Date of Birth to view term test marks</p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '6px' }}>Grade</label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '6px' }}>Term</label>
              <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '6px' }}>Index / Admission Number</label>
            <input
              type="text"
              placeholder="e.g. 10452"
              value={indexNo}
              onChange={(e) => setIndexNo(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '6px' }}>Date of Birth (DOB)</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px',
              background: loading ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Verifying & Fetching...' : 'View Result Sheet'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>

      {/* Result Display & Printable Report */}
      {studentResult && (
        <div style={{ marginTop: '24px' }}>
          
          {/* Print Button */}
          <div className="no-print" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🖨️ Print / Download PDF
            </button>
          </div>

          {/* Printable Report Card Sheet */}
          <div id="printable-report" style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#0f172a' }}>Taxila Maha Vidyalaya - Horana</h2>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#475569' }}>
                Student Progress Report - {selectedGrade}{studentMeta.classSection ? ` (${studentMeta.classSection})` : ''} - {selectedTerm}
              </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <div>
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#334155' }}>
                  <strong>Index No:</strong> {indexNo.toUpperCase()}
                </p>
                {studentMeta.name && (
                  <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#334155' }}>
                    <strong>Name:</strong> {studentMeta.name}
                  </p>
                )}
              </div>
              <span className="no-print" style={{ fontSize: '0.8rem', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                Verified
              </span>
            </div>

            {/* Dynamic Subjects Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', background: '#f1f5f9' }}>
                  <th style={{ padding: '10px 8px', color: '#334155', fontSize: '0.9rem' }}>Subject</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#334155', fontSize: '0.9rem' }}>Marks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(studentResult).map(([key, value]) => {
                  const isAb = String(value).trim().toLowerCase() === 'ab';
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>{key}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: isAb ? '#dc2626' : '#0f172a', fontSize: '0.95rem' }}>
                        {String(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary Cards: Total, Average, Place */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '2px dashed #cbd5e1'
            }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>TOTAL MARKS</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {summaryStats.total}
                </div>
              </div>

              <div style={{ backgroundColor: '#eff6ff', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb' }}>AVERAGE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>
                  {summaryStats.average}%
                </div>
              </div>

              <div style={{ backgroundColor: '#fefce8', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', border: '1px solid #fef08a' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ca8a04' }}>CLASS RANK</span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#a16207', marginTop: '2px' }}>
                  {summaryStats.rank}
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '50px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', width: '180px', borderTop: '1px dashed #334155', paddingTop: '6px', fontSize: '0.85rem' }}>
                Class Teacher
              </div>
              <div style={{ textAlign: 'center', width: '180px', borderTop: '1px dashed #334155', paddingTop: '6px', fontSize: '0.85rem' }}>
                Principal
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}