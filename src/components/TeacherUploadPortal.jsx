import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { client } from '../sanityClient';

const TEACHER_ACCESS_KEY = "TAXILA@TEACHER2026";

const TeacherUploadPortal = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab state: 'upload' or 'report'
  const [activeTab, setActiveTab] = useState('upload');

  // Common Selection States
  const [year, setYear] = useState('2026');
  const [grade, setGrade] = useState('Grade 10');
  const [classSection, setClassSection] = useState('A');
  const [term, setTerm] = useState('Term 1');

  // Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [uploadAnalytics, setUploadAnalytics] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Class Report Viewer States
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportRows, setReportRows] = useState([]);
  const [reportAnalytics, setReportAnalytics] = useState({});
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Helper: Analytics calculation logic
  const calculateAnalytics = (rows) => {
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
            below40++;
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

  // Inline Cell Editing handler for Preview Table
  const handleCellEdit = (rowIndex, columnKey, newValue) => {
    const updatedData = [...parsedData];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [columnKey]: newValue
    };
    setParsedData(updatedData);
    setUploadAnalytics(calculateAnalytics(updatedData));
  };

  // Upload: Handle file select with Strict Format, Structure & Blank Row Filtering
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(null);
    setParsedData([]);
    setUploadAnalytics({});
    setUploadStatus(null);

    // 1. File Extension Validation (.xlsx, .xls, .csv)
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      alert('කරුණාකර වලංගු Excel (.xlsx, .xls) හෝ .csv file එකක් පමණක් තෝරන්න!');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJsonData = XLSX.utils.sheet_to_json(sheet);

        if (!rawJsonData || rawJsonData.length === 0) {
          alert('මෙම file එකේ දත්ත කිසිවක් නැත (Empty file)!');
          e.target.value = '';
          return;
        }

        // Structure Check
        const firstRowKeys = Object.keys(rawJsonData[0]).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const hasIndex = firstRowKeys.some(k => ['indexno', 'index', 'admissionno'].includes(k));
        const hasName = firstRowKeys.some(k => ['studentname', 'name'].includes(k));

        if (!hasIndex || !hasName) {
          alert('වලංගු නොවන Sheet ආකෘතියකි (Invalid Format)! \n\nFile එකේ "Index No" (හෝ Admission No) සහ "Student Name" තීරු අනිවාර්යයෙන්ම තිබිය යුතුය.');
          e.target.value = '';
          return;
        }

        // Blank Row Filter
        const cleanedData = rawJsonData.filter((row) => {
          const idx = row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index;
          const name = row.StudentName || row.Name;
          return (
            idx !== undefined &&
            String(idx).trim() !== '' &&
            name !== undefined &&
            String(name).trim() !== ''
          );
        });

        if (cleanedData.length === 0) {
          alert('මෙම file එකේ වලංගු ශිෂ්‍ය දත්ත කිසිවක් හඳුනාගත නොහැකි විය!');
          e.target.value = '';
          return;
        }

        setSelectedFile(file);
        setParsedData(cleanedData);
        setUploadAnalytics(calculateAnalytics(cleanedData));

      } catch (err) {
        console.error('File parsing error:', err);
        alert('File එක කියවීමේදී දෝෂයක් සිදුවිය. Sheet එක නිවැරදිදැයි පරීක්ෂා කරන්න.');
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Upload to Sanity (Exports the edited preview data back to clean XLSX)
  const handleUploadToSanity = async () => {
    if (!parsedData || parsedData.length === 0) {
      alert('Upload කිරීමට දත්ත කිසිවක් නොමැත!');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // Create updated XLSX workbook from edited table state
      const worksheet = XLSX.utils.json_to_sheet(parsedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const finalBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const safeFileName = selectedFile ? selectedFile.name : `Results_${grade}_${classSection}_${term}.xlsx`;

      const fileAsset = await client.assets.upload('file', finalBlob, {
        filename: safeFileName,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const cleanGrade = grade.toLowerCase().replace(/\s+/g, '');
      const cleanTerm = term.toLowerCase().replace(/\s+/g, '');
      const cleanSection = classSection.toLowerCase().trim();
      const uniqueDocId = `result-${year}-${cleanTerm}-${cleanGrade}-${cleanSection}`;
      const documentTitle = `${year} ${term} ${grade}-${classSection} Results`;

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
      setUploadAnalytics({});
    } catch (error) {
      console.error('Upload failed details:', error);
      setUploadStatus({
        type: 'error',
        msg: `Upload failed: ${error.message || 'Sanity Write Token සහ Network check කරන්න.'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch Class Sheet for Reporting
  const handleFetchClassReport = async () => {
    setReportLoading(true);
    setReportError('');
    setReportRows([]);
    setReportAnalytics({});
    setReportFileUrl('');

    try {
      const query = `*[_type == "resultSheet" && grade == $grade && term == $term && classSection == $section][0]{
        title,
        "fileUrl": file.asset->url
      }`;
      const resultDoc = await client.fetch(query, {
        grade: grade,
        term: term,
        section: classSection,
      });

      if (!resultDoc || !resultDoc.fileUrl) {
        setReportError(`${grade}-${classSection} (${term}) සඳහා තවමත් sheet එකක් upload කර නැත.`);
        setReportLoading(false);
        return;
      }

      setReportFileUrl(resultDoc.fileUrl);

      const response = await fetch(resultDoc.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJsonData = XLSX.utils.sheet_to_json(worksheet);

      const cleanedReportData = rawJsonData.filter((row) => {
        const idx = row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index;
        const name = row.StudentName || row.Name;
        return (
          idx !== undefined &&
          String(idx).trim() !== '' &&
          name !== undefined &&
          String(name).trim() !== ''
        );
      });

      setReportRows(cleanedReportData);
      setReportAnalytics(calculateAnalytics(cleanedReportData));
    } catch (err) {
      console.error('Class sheet fetch error:', err);
      setReportError('Data ලබාගැනීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter students based on search
  const filteredReportRows = reportRows.filter((row) => {
    const idx = String(row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index || '').toLowerCase();
    const name = String(row.StudentName || row.Name || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return idx.includes(q) || name.includes(q);
  });

  // Extract subject columns for class report
  const reportSubjectColumns = reportRows.length > 0
    ? Object.keys(reportRows[0]).filter(k => ![
        'studentname', 'name', 'indexno', 'index', 'admissionno', 
        'grade', 'term', 'section', 'class', 'classsection', 'dob', 
        'date of birth', 'birthday', '__rownum__', 'total', 'average', 'rank', 'place'
      ].includes(k.toLowerCase().trim()))
    : [];

  // --- VIEW 1: Password Gatekeeper ---
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '430px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 32px', boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '68px', height: '68px', backgroundColor: '#eff6ff', borderRadius: '50%', fontSize: '30px', marginBottom: '18px' }}>
            🔒
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>ගුරු ද්වාරය (Teacher Portal)</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px 0' }}>ප්‍රතිඵල කළමනාකරණය සඳහා Passcode එක ඇතුළත් කරන්න.</p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="••••••••••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #2563eb', fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: '12px', fontWeight: '700' }}
              required
            />
            {authError && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '14px', border: '1px solid #fecaca' }}>
                {authError}
              </div>
            )}
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}>
              Unlock Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Dashboard with Tabs ---
  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: flex !important; }
          body { background: #fff !important; }
          #report-sheet { border: none !important; padding: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '18px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>ගුරු කළමනාකරණ පද්ධතිය (Teacher Portal)</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>Results upload කරන්න හෝ පන්ති ලකුණු වාර්තාව (Class Mark Sheet) බලා Print කරගන්න.</p>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          style={{ padding: '6px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' }}
        >
          Logout
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'upload' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'upload' ? '#2563eb' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          📤 Upload Results
        </button>
        <button
          onClick={() => setActiveTab('report')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'report' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'report' ? '#2563eb' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          📋 Class Mark Sheet (වාර්තාව)
        </button>
      </div>

      {/* Selectors Grid */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>YEAR</label>
          <input type="text" value={year} onChange={(e) => setYear(e.target.value)} style={inputControlStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>GRADE</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} style={inputControlStyle}>
            {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'].map((g) => (
              <option key={g} value={g} style={optionStyle}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>SECTION</label>
          <select value={classSection} onChange={(e) => setClassSection(e.target.value)} style={inputControlStyle}>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((sec) => (
              <option key={sec} value={sec} style={optionStyle}>Section {sec}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>TERM</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)} style={inputControlStyle}>
            <option value="Term 1" style={optionStyle}>Term 1</option>
            <option value="Term 2" style={optionStyle}>Term 2</option>
            <option value="Term 3" style={optionStyle}>Term 3</option>
          </select>
        </div>
      </div>

      {/* TAB 1: UPLOAD VIEW */}
      {activeTab === 'upload' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px dashed #93c5fd', backgroundColor: '#f8fafc', padding: '36px 20px', textAlign: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '38px', marginBottom: '8px' }}>📑</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>
                {selectedFile ? selectedFile.name : 'Excel (.xlsx, .csv) file එකක් තෝරන්න'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Click කර පරිගණකයෙන් file එක තෝරන්න</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>

          {parsedData.length > 0 && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>Preview: ළමුන් {parsedData.length} දෙනෙකු හඳුනා ගැනිණි</span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>💡 වැරදි ඇති කොටු මෙතැනදීම ක්ලික් කර නිවැරදි කළ හැක</p>
                </div>
                <button
                  onClick={handleUploadToSanity}
                  disabled={isUploading}
                  style={{ padding: '9px 18px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.88rem', cursor: isUploading ? 'not-allowed' : 'pointer' }}
                >
                  {isUploading ? 'Upload වෙමින් පවතී...' : 'Submit to Sanity 🚀'}
                </button>
              </div>

              {/* Editable Preview Table */}
              <div style={{ maxHeight: '280px', overflowY: 'auto', marginTop: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', backgroundColor: '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                      {Object.keys(parsedData[0]).map((col) => (
                        <th key={col} style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {Object.keys(parsedData[0]).map((col) => {
                          const val = String(row[col] ?? '');
                          const isDobField = col.toLowerCase().includes('dob') || col.toLowerCase().includes('birth');
                          // DOB validation: YYYY-MM-DD nathnam (e.g. 39716 wage number ekak nam) red alert
                          const isInvalidDob = isDobField && (!val.includes('-') || val.length < 8);

                          return (
                            <td key={col} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleCellEdit(rowIdx, col, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  border: isInvalidDob ? '2px solid #ef4444' : '1px solid transparent',
                                  backgroundColor: isInvalidDob ? '#fef2f2' : 'transparent',
                                  color: isInvalidDob ? '#dc2626' : '#1e293b',
                                  fontWeight: isInvalidDob ? '700' : 'normal',
                                  boxSizing: 'border-box',
                                  outline: 'none',
                                  transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.target.style.border = isInvalidDob ? '2px solid #ef4444' : '1px solid #2563eb'}
                                onBlur={(e) => e.target.style.border = isInvalidDob ? '2px solid #ef4444' : '1px solid transparent'}
                                title={isInvalidDob ? 'වැරදි DOB ආකෘතියකි! කරුණාකර YYYY-MM-DD ආකෘතියෙන් සකසන්න[cite: 1].' : ''}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadStatus && (
            <div style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', backgroundColor: uploadStatus.type === 'success' ? '#f0fdf4' : '#fef2f2', color: uploadStatus.type === 'success' ? '#15803d' : '#b91c1c', border: `1px solid ${uploadStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {uploadStatus.msg}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS MARK SHEET (REPORT VIEWER) */}
      {activeTab === 'report' && (
        <div>
          <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={handleFetchClassReport}
              disabled={reportLoading}
              style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: reportLoading ? 'not-allowed' : 'pointer' }}
            >
              {reportLoading ? 'Loading Sheet...' : 'View Class Mark Sheet 🔍'}
            </button>
          </div>

          {reportError && (
            <div className="no-print" style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.9rem' }}>
              {reportError}
            </div>
          )}

          {reportRows.length > 0 && (
            <div id="report-sheet">
              {/* Header Title */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#0f172a' }}>
                  ලකුණු වාර්තාව - ශ්‍රේණිය {grade.replace('Grade ', '')}_{classSection} ({term})
                </h2>
              </div>

              {/* Search Bar & Action Buttons */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="🔍 නම හෝ ඇතුළත් අංකයෙන් සොයන්න..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {reportFileUrl && (
                    <a
                      href={reportFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '8px 14px', backgroundColor: '#059669', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600' }}
                    >
                      Download Excel Sheet
                    </a>
                  )}
                  <button
                    onClick={handlePrint}
                    style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
                  >
                    🖨️ Print / Save as PDF
                  </button>
                </div>
              </div>

              {/* Master Table: Students + Integrated Analytics at the Bottom */}
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', width: '90px' }}>ඇතුළත් අංකය</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'left', minWidth: '150px', color: '#1e293b' }}>නම</th>
                      {reportSubjectColumns.map((col) => (
                        <th key={col} style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Student Rows */}
                    {filteredReportRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 6px', border: '1px solid #e2e8f0', fontWeight: '700' }}>
                          {row.IndexNo || row['Index No'] || row.AdmissionNo || row.Index}
                        </td>
                        <td style={{ padding: '8px 6px', border: '1px solid #e2e8f0', textAlign: 'left', fontWeight: '600' }}>
                          {row.StudentName || row.Name}
                        </td>
                        {reportSubjectColumns.map((col) => (
                          <td key={col} style={{ padding: '8px 6px', border: '1px solid #e2e8f0' }}>
                            {String(row[col] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Integrated Analytics Rows */}
                    {Object.keys(reportAnalytics).length > 0 && (
                      <>
                        <tr style={{ height: '14px', backgroundColor: '#f1f5f9' }}>
                          <td colSpan={2 + reportSubjectColumns.length} style={{ border: '1px solid #cbd5e1', padding: 0 }}></td>
                        </tr>

                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', border: '1px solid #cbd5e1', color: '#dc2626' }}>
                            40ට අඩු
                          </td>
                          {reportSubjectColumns.map((c) => (
                            <td key={c} style={{ padding: '8px 6px', border: '1px solid #cbd5e1' }}>
                              {reportAnalytics[c]?.below40 ?? 0}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', border: '1px solid #cbd5e1', color: '#16a34a' }}>
                            40ට වැඩි
                          </td>
                          {reportSubjectColumns.map((c) => (
                            <td key={c} style={{ padding: '8px 6px', border: '1px solid #cbd5e1' }}>
                              {reportAnalytics[c]?.above40 ?? 0}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#fef2f2' }}>
                          <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', border: '1px solid #cbd5e1', color: '#dc2626' }}>
                            40ට අඩු %
                          </td>
                          {reportSubjectColumns.map((c) => (
                            <td key={c} style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                              {reportAnalytics[c]?.below40Percent ?? '0.00'}%
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}>
                          <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', border: '1px solid #cbd5e1', color: '#16a34a' }}>
                            40ට වැඩි %
                          </td>
                          {reportSubjectColumns.map((c) => (
                            <td key={c} style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                              {reportAnalytics[c]?.above40Percent ?? '0.00'}%
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                            උපරිම ලකුණු
                          </td>
                          {reportSubjectColumns.map((c) => (
                            <td key={c} style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                              {reportAnalytics[c]?.max ?? '0.00'}
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                            අවම ලකුණු
                          </td>
                          {reportSubjectColumns.map((c) => (
                            <td key={c} style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '600' }}>
                              {reportAnalytics[c]?.min ?? '0.00'}
                            </td>
                          ))}
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px', fontSize: '0.85rem', color: '#334155' }}>
                <div>
                  <p style={{ margin: '0 0 10px 0' }}>පන්තිභාර ගුරුභවතාගේ නම : ..............................................</p>
                  <p style={{ margin: 0 }}>විදුහල්පතිතුමාගේ අත්සන : ..............................................</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 10px 0' }}>අත්සන : ..............................................</p>
                  <p style={{ margin: 0 }}>දිනය : ..............................................</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherUploadPortal;