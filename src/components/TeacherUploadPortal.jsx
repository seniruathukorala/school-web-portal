import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { client } from '../sanityClient';

const TEACHER_ACCESS_KEY = "TAXILA@TEACHER2026";

const TeacherUploadPortal = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [year, setYear] = useState('2026');
  const [grade, setGrade] = useState('Grade 10');
  const [classSection, setClassSection] = useState('A');
  const [term, setTerm] = useState('Term 1');

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const inputControlStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer'
  };

  const optionStyle = {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '0.95rem'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === TEACHER_ACCESS_KEY) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('මුරපදය වැරදියි! (Invalid Access Passcode)');
    }
  };

  // Helper function: Calculate 40 below/above analytics from Excel rows
  const generateAnalytics = (rows) => {
    if (!rows || rows.length === 0) return {};

    const ignoredKeys = [
      'studentname', 'name', 'indexno', 'index', 'admissionno', 
      'grade', 'term', 'section', 'class', 'classsection', 'dob', 
      'date of birth', 'birthday', '__rownum__', 'total', 'average', 'rank', 'place'
    ];

    const subjectKeys = Object.keys(rows[0]).filter(
      (key) => !ignoredKeys.includes(key.toLowerCase().trim())
    );

    const stats = {};

    subjectKeys.forEach((subj) => {
      let below40 = 0;
      let above40 = 0;
      const validMarks = [];

      rows.forEach((row) => {
        const val = row[subj];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const cleanStr = String(val).trim().toLowerCase();
          if (cleanStr === 'ab') {
            below40++; // Absent nam 40ta adu gannata count karanawa
            validMarks.push(0);
          } else {
            const num = Number(cleanStr);
            if (!isNaN(num)) {
              if (num < 40) below40++;
              else above40++;
              validMarks.push(num);
            }
          }
        }
      });

      const totalCount = below40 + above40;
      if (totalCount > 0) {
        stats[subj] = {
          below40,
          above40,
          below40Percent: ((below40 / totalCount) * 100).toFixed(2),
          above40Percent: ((above40 / totalCount) * 100).toFixed(2),
          max: validMarks.length > 0 ? Math.max(...validMarks).toFixed(2) : '0.00',
          min: validMarks.length > 0 ? Math.min(...validMarks).toFixed(2) : '0.00',
        };
      }
    });

    return stats;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setParsedData(jsonData);

        // Auto calculate class analytics
        const stats = generateAnalytics(jsonData);
        setAnalyticsData(stats);
      } catch (err) {
        console.error('File parsing error:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUploadToSanity = async () => {
    if (!selectedFile) {
      alert('කරුණාකර Excel (.xlsx / .csv) file එකක් තෝරන්න!');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // FIX 1: Provide safe fallback content type if browser sets empty
      const safeContentType = selectedFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // 1. Upload Excel file to Sanity Assets
      const fileAsset = await client.assets.upload('file', selectedFile, {
        filename: selectedFile.name,
        contentType: safeContentType,
      });

      // 2. Generate Deterministic Unique ID
      const cleanGrade = grade.toLowerCase().replace(/\s+/g, '');
      const cleanTerm = term.toLowerCase().replace(/\s+/g, '');
      const cleanSection = classSection.toLowerCase().trim();
      const uniqueDocId = `result-${year}-${cleanTerm}-${cleanGrade}-${cleanSection}`;

      // FIX 2: One-line title without unexpected break
      const documentTitle = `${year} ${term} ${grade}-${classSection} Results`;

      // 3. createOrReplace
      await client.createOrReplace({
        _id: uniqueDocId,
        _type: 'resultSheet',
        title: documentTitle,
        year: year,
        term: term,
        grade: grade,
        classSection: classSection,
        file: {
          _type: 'file',
          asset: {
            _type: 'reference',
            _ref: fileAsset._id,
          },
        },
      });

      setUploadStatus({
        type: 'success',
        msg: `සාර්ථකව යාවත්කාලීන / Upload විය: ${documentTitle} ✅`,
      });
      setSelectedFile(null);
      setParsedData([]);
      setAnalyticsData({});
    } catch (error) {
      console.error('Upload failed details:', error);
      setUploadStatus({
        type: 'error',
        msg: `Upload failed: ${error.message || 'කරුණාකර Sanity Write Token සහ Network check කරන්න.'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- VIEW 1: Password Gatekeeper ---
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '20px',
        fontFamily: 'Segoe UI, Roboto, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '68px',
            height: '68px',
            backgroundColor: '#eff6ff',
            borderRadius: '50%',
            fontSize: '30px',
            marginBottom: '18px'
          }}>
            🔒
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
            ගුරු ද්වාරය (Teacher Portal)
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.5' }}>
            ප්‍රතිඵල ඇතුළත් කිරීමට පාසලේ Access Passcode එක ඇතුළත් කරන්න.
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="••••••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #2563eb',
                fontSize: '1.2rem',
                letterSpacing: '4px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '12px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: '700'
              }}
              required
            />

            {authError && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                marginBottom: '14px',
                border: '1px solid #fecaca'
              }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              Unlock Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Teacher Upload Dashboard ---
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      fontFamily: 'Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '18px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
            විභාග ලකුණු Upload පද්ධතිය
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Year, Grade, Section, සහ Term තෝරා අදාළ Excel file එක (.xlsx / .csv) Upload කරන්න.
          </p>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          style={{
            padding: '6px 14px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#475569',
            fontSize: '0.82rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </div>

      {/* Selectors Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Year */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            YEAR
          </label>
          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={inputControlStyle}
          />
        </div>

        {/* Grade */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            GRADE (ශ්‍රේණිය)
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            style={inputControlStyle}
          >
            {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'].map((g) => (
              <option key={g} value={g} style={optionStyle}>{g}</option>
            ))}
          </select>
        </div>

        {/* Class Section */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            SECTION (පන්තිය)
          </label>
          <select
            value={classSection}
            onChange={(e) => setClassSection(e.target.value)}
            style={inputControlStyle}
          >
            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((sec) => (
              <option key={sec} value={sec} style={optionStyle}>Section {sec}</option>
            ))}
          </select>
        </div>

        {/* Term */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            TERM (වාරය)
          </label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={inputControlStyle}
          >
            <option value="Term 1" style={optionStyle}>Term 1</option>
            <option value="Term 2" style={optionStyle}>Term 2</option>
            <option value="Term 3" style={optionStyle}>Term 3</option>
          </select>
        </div>
      </div>

      {/* File Drop Box */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          border: '2px dashed #93c5fd',
          backgroundColor: '#f8fafc',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: 'pointer'
        }}>
          <span style={{ fontSize: '38px', marginBottom: '8px' }}>📑</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>
            {selectedFile ? selectedFile.name : 'Excel (.xlsx, .csv) file එකක් මෙතැනට තෝරන්න'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Click කර පරිගණකයෙන් file එක තෝරන්න
          </span>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Preview Table & Analytics */}
      {parsedData.length > 0 && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>
              Preview: ළමුන් {parsedData.length} දෙනෙකු හඳුනා ගැනිණි
            </span>
            <button
              onClick={handleUploadToSanity}
              disabled={isUploading}
              style={{
                padding: '9px 18px',
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.88rem',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.7 : 1
              }}
            >
              {isUploading ? 'Upload වෙමින් පවතී...' : 'Submit to Sanity 🚀'}
            </button>
          </div>

          {/* Student Marks Preview */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', backgroundColor: '#fff', color: '#0f172a' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#0f172a' }}>
                  {Object.keys(parsedData[0]).map((col) => (
                    <th key={col} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: '700' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#1e293b' }}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subject Performance Analytics (40 Below/Above Summary) */}
          {Object.keys(analyticsData).length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                📊 විෂය අනුව ලකුණු විශ්ලේෂණය (Subject Analysis Summary)
              </span>
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#1e293b' }}>විෂය / නිර්ණායක</th>
                      {Object.keys(analyticsData).map((subj) => (
                        <th key={subj} style={{ padding: '10px', color: '#1e293b', fontWeight: '700' }}>{subj}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#dc2626' }}>40ට අඩු</td>
                      {Object.values(analyticsData).map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px' }}>{d.below40}</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#16a34a' }}>40ට වැඩි</td>
                      {Object.values(analyticsData).map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px' }}>{d.above40}</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fef2f2' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#dc2626' }}>40ට අඩු %</td>
                      {Object.values(analyticsData).map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px', fontWeight: '600' }}>{d.below40Percent}%</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f0fdf4' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#16a34a' }}>40ට වැඩි %</td>
                      {Object.values(analyticsData).map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px', fontWeight: '600' }}>{d.above40Percent}%</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#1e293b' }}>උපරිම ලකුණු</td>
                      {Object.values(analyticsData).map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px', fontWeight: '600' }}>{d.max}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#1e293b' }}>අවම ලකුණු</td>
                      {Object.values(analyticsData).map((d, i) => (
                        <td key={i} style={{ padding: '8px 10px', fontWeight: '600' }}>{d.min}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Message */}
      {uploadStatus && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '600',
          backgroundColor: uploadStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: uploadStatus.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${uploadStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {uploadStatus.msg}
        </div>
      )}
    </div>
  );
};

export default TeacherUploadPortal;