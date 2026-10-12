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
  const [error, setError] = useState('');

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
        setError(`No result sheet uploaded for ${selectedGrade} - ${selectedTerm} yet.`);
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

      // 3. Match both Index Number AND Date of Birth (DOB)
      const student = jsonData.find((row) => {
        const fileIndex = String(row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index || '').trim().toLowerCase();
        const fileDob = String(row.DOB || row['Date of Birth'] || row.Birthday || '').trim();

        // Standardize input date strings
        const inputDob = dob.trim();

        return fileIndex === indexNo.trim().toLowerCase() && fileDob === inputDob;
      });

      if (student) {
        // Exclude internal DOB field from display for privacy
        const { DOB, 'Date of Birth': d1, Birthday: d2, ...displayMarks } = student;
        setStudentResult(displayMarks);
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
    <div style={{ maxWidth: '580px', margin: '30px auto', padding: '30px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
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

      {studentResult && (
        <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Term Test Results</h3>
            <span style={{ fontSize: '0.8rem', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>Verified</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(studentResult).map(([key, value]) => (
                <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 4px', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}>{key}</td>
                  <td style={{ padding: '9px 4px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}