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
  const [summaryStats, setSummaryStats] = useState({ total: 0, average: 0, rank: '-' });
  const [error, setError] = useState('');

  // Browser print window eka open karana function eka
  const handlePrint = () => {
    window.print();
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
      // 1. Fetch matching result sheet from Sanity
      const query = `*[_type == "resultSheet" && grade == $grade && term == $term][0]{
        title,
        "fileUrl": file.asset->url
      }`;
      const sheetData = await client.fetch(query, { grade: selectedGrade, term: selectedTerm });

      if (!sheetData || !sheetData.fileUrl) {
        setError(`No result sheet uploaded for ${selectedGrade} ${selectedTerm} yet.`);
        setLoading(false);
        return;
      }

      // 2. Fetch and parse the Excel file
      const response = await fetch(sheetData.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Meta keys list to ignore when identifying subject columns
      const ignoredKeys = [
        'studentname', 'name', 'indexno', 'index', 'admissionno', 
        'grade', 'term', 'section', 'class', 'classsection', 'dob', 
        'date of birth', 'birthday', '__rownum__', 'total', 'average', 'rank', 'place'
      ];

      // 3. Match both Index Number AND Date of Birth (DOB)
      const student = jsonData.find((row) => {
        const fileIndex = String(row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index || '').trim().toLowerCase();
        const fileDob = String(row.DOB || row['Date of Birth'] || row.Birthday || '').trim();
        const inputDob = dob.trim();

        return fileIndex === indexNo.trim().toLowerCase() && fileDob === inputDob;
      });

      if (student) {
        // Exclude internal DOB field from display
        const { DOB, 'Date of Birth': d1, Birthday: d2, ...displayMarks } = student;
        setStudentResult(displayMarks);

        // Calculate Rank across the entire sheet (handling 'Ab' as 0)
        const studentTotals = jsonData.map((row) => {
          const rIndex = String(row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index || '').trim().toLowerCase();
          let rowTot = 0;
          Object.entries(row).forEach(([k, v]) => {
            if (!ignoredKeys.includes(k.toLowerCase().trim())) {
              const valStr = String(v).trim().toLowerCase();
              if (valStr !== 'ab') {
                const num = Number(valStr);
                if (!isNaN(num)) rowTot += num;
              }
            }
          });
          return { index: rIndex, total: rowTot };
        });

        // Sort descending to find rank
        studentTotals.sort((a, b) => b.total - a.total);
        const currentIndex = indexNo.trim().toLowerCase();
        const place = studentTotals.findIndex(item => item.index === currentIndex) + 1;

        // Current student's subjects list
        const subjectEntries = Object.entries(displayMarks).filter(
          ([k]) => !ignoredKeys.includes(k.toLowerCase().trim())
        );

        let curTotal = 0;
        const totalSubjectsCount = subjectEntries.length; // Muluma vishayan gaana (Ab sahitha siyalla)

        subjectEntries.forEach(([_, v]) => {
          const valStr = String(v).trim().toLowerCase();
          if (valStr !== 'ab') {
            const num = Number(valStr);
            if (!isNaN(num)) {
              curTotal += num;
            }
          }
        });

        // Muluma vishayan gaanen bedala average hadanawa (Ab thibbath total count eken bedanawa)
        const curAverage = totalSubjectsCount > 0 ? (curTotal / totalSubjectsCount).toFixed(1) : 0;

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

  const ignoredDisplayKeys = [
    'studentname', 'name', 'indexno', 'index', 'admissionno', 
    'grade', 'term', 'section', 'class', 'classsection', '__rownum__'
  ];

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

      {/* Search Section (Print wena welawata hide wenawa) */}
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
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#475569' }}>Student Progress Report - {selectedGrade} ({selectedTerm})</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
              <div>
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#334155' }}>
                  <strong>Index No:</strong> {indexNo.toUpperCase()}
                </p>
                {(studentResult.StudentName || studentResult.Name) && (
                  <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#334155' }}>
                    <strong>Name:</strong> {studentResult.StudentName || studentResult.Name}
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
                {Object.entries(studentResult)
                  .filter(([key]) => !ignoredDisplayKeys.includes(key.toLowerCase().trim()))
                  .map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>{key}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{String(value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* --- Summary Cards: Total, Average, Place --- */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '2px dashed #cbd5e1'
            }}>
              {/* Total Card */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '12px 8px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>
                  TOTAL MARKS
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {summaryStats.total}
                </div>
              </div>

              {/* Average Card */}
              <div style={{
                backgroundColor: '#eff6ff',
                borderRadius: '10px',
                padding: '12px 8px',
                textAlign: 'center',
                border: '1px solid #bfdbfe'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb' }}>
                  AVERAGE
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>
                  {summaryStats.average}%
                </div>
              </div>

              {/* Place / Rank Card */}
              <div style={{
                backgroundColor: '#fefce8',
                borderRadius: '10px',
                padding: '12px 8px',
                textAlign: 'center',
                border: '1px solid #fef08a'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ca8a04' }}>
                  CLASS RANK
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#a16207', marginTop: '2px' }}>
                  {summaryStats.rank}
                </div>
              </div>
            </div>

            {/* Signatures (Print wena PDF eke yatin witharak penenne) */}
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