import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { client } from '../sanityClient';

const TEACHER_ACCESS_KEY = "TAXILA@TEACHER2026";

// Sri Lankan School Subject Structure Configuration
const SUBJECT_CONFIG = {
  junior: { // Grade 6 - 9
    core: ['Sinhala', 'Buddhism', 'Mathematics', 'Science', 'English', 'History', 'Geography', 'Civics', 'PTS', 'Health'],
    aesthetics: ['Art', 'Music', 'Dancing', 'Drama']
  },
  ol: { // Grade 10 - 11
    core: ['Sinhala', 'Buddhism', 'Mathematics', 'Science', 'English', 'History'],
    basket1: ['Commerce', 'Geography', 'Civics', 'Tamil', 'French'],
    basket2: ['Art', 'Music', 'Dancing', 'Drama', 'English Lit', 'Sinhala Lit'],
    basket3: ['ICT', 'Agriculture', 'Health', 'Home Science', 'Technical']
  },
  al: { // Grade 12 - 13
    streams: {
      maths: ['Combined Maths', 'Physics', 'Chemistry', 'ICT'],
      bio: ['Biology', 'Chemistry', 'Physics', 'Agri'],
      commerce: ['Accounting', 'Business Studies', 'Economics', 'ICT'],
      arts: ['Sinhala', 'Political Science', 'Logic', 'Geography'],
      tech: ['Engineering Tech', 'Bio-systems Tech', 'Science for Tech', 'ICT']
    },
    common: ['General English', 'GIT']
  }
};

const TeacherUploadPortal = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab state: 'entry' or 'report'
  const [activeTab, setActiveTab] = useState('entry');

  // Common Selection States
  const [year, setYear] = useState('2026');
  const [grade, setGrade] = useState('Grade 10');
  const [classSection, setClassSection] = useState('A');
  const [term, setTerm] = useState('Term 1');
  const [alStream, setAlStream] = useState('maths');

  // Direct Entry & Edit States
  const [tableRows, setTableRows] = useState([]);
  const [isEditing, setIsEditing] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
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

  const getGradeCategory = () => {
    const num = parseInt(grade.replace(/\D/g, ''), 10);
    if (num >= 6 && num <= 9) return 'junior';
    if (num >= 10 && num <= 11) return 'ol';
    if (num >= 12 && num <= 13) return 'al';
    return 'ol';
  };

  const category = getGradeCategory();

  const getActiveCoreSubjects = () => {
    if (category === 'al') {
      return [...(SUBJECT_CONFIG.al.streams[alStream] || []), ...SUBJECT_CONFIG.al.common];
    }
    return SUBJECT_CONFIG[category].core;
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

  const calculateAnalytics = (rows) => {
    if (!rows || rows.length === 0) return {};

    const ignoredKeys = [
      'studentname', 'name', 'nama', 'indexno', 'index', 'admissionno', 'athulathankaya',
      'grade', 'term', 'section', 'class', 'classsection', 'dob', 
      'dateofbirth', 'birthday', 'rownum', 'total', 'average', 'rank', 'place'
    ];

    const subjectKeys = Object.keys(rows[0]).filter(
      (key) => !ignoredKeys.includes(key.toLowerCase().replace(/[^a-z0-9]/g, ''))
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

  // Total, Average saha Class Rank auto calculate karana helper eka
  const enrichRowsWithRankAndStats = (rows, subjectCols) => {
    if (!rows || rows.length === 0) return [];

    const calculatedRows = rows.map((row) => {
      let total = 0;
      let hasValidMarks = false;

      subjectCols.forEach((subj) => {
        const val = row[subj];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const cleanStr = String(val).trim().toLowerCase();
          if (cleanStr !== 'ab') {
            const num = Number(cleanStr);
            if (!isNaN(num)) {
              total += num;
              hasValidMarks = true;
            }
          } else {
            hasValidMarks = true; // Absent unath exam count wenawa
          }
        }
      });

      const avg = subjectCols.length > 0 ? (total / subjectCols.length).toFixed(2) : '0.00';

      return {
        ...row,
        __total: hasValidMarks ? total : '-',
        __numericTotal: total,
        __avg: hasValidMarks ? avg : '-'
      };
    });

    // Rank calculate karanawa Total descending order ekata
    const sortedTotals = [...new Set(calculatedRows.map(r => r.__numericTotal))].sort((a, b) => b - a);

    return calculatedRows.map((row) => {
      let rank = '-';
      if (row.__total !== '-') {
        rank = sortedTotals.indexOf(row.__numericTotal) + 1;
      }
      return {
        ...row,
        __rank: rank
      };
    });
  };

  const createBlankRow = () => ({
    id: Date.now() + Math.random(),
    indexNo: '',
    name: '',
    coreMarks: {},
    baskets: {
      b1: { sub: '', mark: '' },
      b2: { sub: '', mark: '' },
      b3: { sub: '', mark: '' }
    }
  });

  const formatMarkValue = (val) => {
    if (val === undefined || val === null || String(val).trim() === '') return '';
    const cleanStr = String(val).trim();
    if (cleanStr.toLowerCase() === 'ab') return 'Ab';
    const num = Number(cleanStr);
    return isNaN(num) ? cleanStr : num;
  };

  const getSanityQueryAndParams = (targetTerm) => {
    const numGrade = grade.replace(/\D/g, '').trim();
    const cleanSection = classSection.trim();
    const cleanGradeStr = grade.toLowerCase().replace(/\s+/g, '');
    const cleanTermStr = targetTerm.toLowerCase().replace(/\s+/g, '');
    const uniqueDocId = `result-${year}-${cleanTermStr}-${cleanGradeStr}-${cleanSection.toLowerCase()}`;

    const query = `*[_type == "resultSheet" && (_id == $uniqueDocId || (term == $targetTerm && (grade == $grade || grade == $shortGrade || grade == $pureGrade) && (classSection == $section || classSection == $fullSection || classSection == $dashSection)))][0]{
      _id,
      title,
      year,
      grade,
      term,
      classSection,
      "fileUrl": file.asset->url
    }`;

    const params = {
      uniqueDocId,
      targetTerm,
      grade: grade,
      shortGrade: `Grade ${numGrade}`,
      pureGrade: numGrade,
      section: cleanSection,
      fullSection: `${numGrade}-${cleanSection}`,
      dashSection: `${numGrade} - ${cleanSection}`
    };

    return { query, params };
  };

  const fetchSheetData = async (targetTerm) => {
    try {
      const { query, params } = getSanityQueryAndParams(targetTerm);
      const resultDoc = await client.fetch(query, params);

      if (!resultDoc || !resultDoc.fileUrl) return null;

      const response = await fetch(resultDoc.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    } catch (err) {
      console.error(`fetchSheetData error for ${targetTerm}:`, err);
      return null;
    }
  };

  const mapJsonToTableRows = (jsonData, isCopyingPrevTerm = false) => {
    const coreList = getActiveCoreSubjects();

    return jsonData.map((row) => {
      let idx = '';
      let name = '';

      Object.keys(row).forEach((k) => {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (['indexno', 'index', 'admissionno', 'athulathankaya'].includes(cleanK)) {
          idx = row[k];
        }
        if (['studentname', 'name', 'nama'].includes(cleanK)) {
          name = row[k];
        }
      });

      const coreMarks = {};
      const baskets = {
        b1: { sub: '', mark: '' },
        b2: { sub: '', mark: '' },
        b3: { sub: '', mark: '' }
      };

      const blacklistedKeys = [
        'studentname', 'name', 'nama',
        'indexno', 'index', 'admissionno', 'athulathankaya',
        'grade', 'term', 'section', 'class', 'classsection', 
        'dob', 'dateofbirth', 'birthday', 'rownum', 'total', 'average', 'rank', 'place'
      ];

      Object.keys(row).forEach((col) => {
        const cleanCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (!blacklistedKeys.includes(cleanCol)) {
          const rawVal = row[col];
          const markVal = isCopyingPrevTerm ? '' : (rawVal !== '' ? String(rawVal) : '');

          const matchedCore = coreList.find(
            c => c.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCol
          );

          if (matchedCore) {
            coreMarks[matchedCore] = markVal;
          } else {
            if (!baskets.b1.sub) baskets.b1 = { sub: col, mark: markVal };
            else if (!baskets.b2.sub) baskets.b2 = { sub: col, mark: markVal };
            else if (!baskets.b3.sub) baskets.b3 = { sub: col, mark: markVal };
          }
        }
      });

      return {
        id: idx || Date.now() + Math.random(),
        indexNo: String(idx ?? '').trim(),
        name: String(name ?? '').trim(),
        coreMarks,
        baskets
      };
    });
  };

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'entry') return;

    const loadTableData = async () => {
      setTableLoading(true);
      setUploadStatus(null);
      try {
        const currentData = await fetchSheetData(term);

        if (currentData && currentData.length > 0) {
          setTableRows(mapJsonToTableRows(currentData, false));
          setHasExistingData(true);
          setIsEditing(false);
        } else {
          setHasExistingData(false);
          setIsEditing(true);

          const termOrder = ['Term 1', 'Term 2', 'Term 3'];
          const currentIndex = termOrder.indexOf(term);
          let prevFound = false;

          if (currentIndex > 0) {
            for (let i = currentIndex - 1; i >= 0; i--) {
              const prevTerm = termOrder[i];
              const prevData = await fetchSheetData(prevTerm);
              if (prevData && prevData.length > 0) {
                setTableRows(mapJsonToTableRows(prevData, true));
                prevFound = true;
                break;
              }
            }
          }

          if (!prevFound) {
            setTableRows([createBlankRow(), createBlankRow(), createBlankRow()]);
          }
        }
      } catch (err) {
        console.error('Error loading class data:', err);
      } finally {
        setTableLoading(false);
      }
    };

    loadTableData();
  }, [isAuthenticated, activeTab, year, grade, classSection, term, alStream]);

  const handleAddRow = () => {
    setTableRows(prev => [...prev, createBlankRow()]);
  };

  const handleRemoveRow = (id) => {
    setTableRows(prev => prev.filter(r => r.id !== id));
  };

  const handleFieldChange = (id, field, value) => {
    setTableRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCoreMarkChange = (id, subject, mark) => {
    setTableRows(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, coreMarks: { ...r.coreMarks, [subject]: mark } };
      }
      return r;
    }));
  };

  const handleBasketChange = (id, basketKey, prop, val) => {
    setTableRows(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          baskets: {
            ...r.baskets,
            [basketKey]: { ...r.baskets[basketKey], [prop]: val }
          }
        };
      }
      return r;
    }));
  };

  const handleSaveToSanity = async () => {
    const validRows = tableRows.filter(r => r.indexNo.trim() !== '' && r.name.trim() !== '');
    if (validRows.length === 0) {
      alert('ඇතුළත් කිරීමට වලංගු ශිෂ්‍ය දත්ත නොමැත! (Index No සහ Name ඇතුළත් කරන්න)');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const coreList = getActiveCoreSubjects();

      const flatData = validRows.map(row => {
        const item = {
          'Index No': row.indexNo.trim(),
          'Student Name': row.name.trim()
        };

        coreList.forEach(sub => {
          item[sub] = formatMarkValue(row.coreMarks[sub]);
        });

        if (category === 'junior') {
          if (row.baskets.b1.sub) {
            item[row.baskets.b1.sub] = formatMarkValue(row.baskets.b1.mark);
          }
        } else if (category === 'ol') {
          ['b1', 'b2', 'b3'].forEach(bKey => {
            const b = row.baskets[bKey];
            if (b.sub) {
              item[b.sub] = formatMarkValue(b.mark);
            }
          });
        }

        return item;
      });

      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const finalBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const safeFileName = `Results_${year}_${grade}_${classSection}_${term}.xlsx`;

      const sanityConfig = client.config();
      const projectId = sanityConfig.projectId;
      const dataset = sanityConfig.dataset;
      const token = sanityConfig.token;

      let fileAssetId = null;

      if (token) {
        const uploadResponse = await fetch(
          `https://${projectId}.api.sanity.io/v2021-06-07/assets/files/${dataset}?filename=${encodeURIComponent(safeFileName)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              Authorization: `Bearer ${token}`
            },
            body: finalBlob
          }
        );

        if (!uploadResponse.ok) {
          const errBody = await uploadResponse.json();
          throw new Error(errBody.message || 'Direct asset upload failed');
        }

        const fileAssetData = await uploadResponse.json();
        fileAssetId = fileAssetData.document._id;
      } else {
        const fileAsset = await client.assets.upload('file', finalBlob, {
          filename: safeFileName,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        fileAssetId = fileAsset._id;
      }

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
            _ref: fileAssetId,
          },
        },
      });

      setUploadStatus({
        type: 'success',
        msg: `ලකුණු සාර්ථකව සුරැකිණි: ${documentTitle} ✅`,
      });
      setIsEditing(false);
      setHasExistingData(true);
    } catch (error) {
      console.error('Save failed details:', error);
      setUploadStatus({
        type: 'error',
        msg: `සුරැකීම අසාර්ථක විය: ${error.message || 'Sanity Write Token සහ Network check කරන්න.'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFetchClassReport = async () => {
    setReportLoading(true);
    setReportError('');
    setReportRows([]);
    setReportAnalytics({});
    setReportFileUrl('');

    try {
      const { query, params } = getSanityQueryAndParams(term);
      const resultDoc = await client.fetch(query, params);

      if (!resultDoc || !resultDoc.fileUrl) {
        setReportError(`${grade}-${classSection} (${term}) සඳහා Sanity හි sheet එකක් හමු නොවීය. කරුණාකර පළමුව "Result Entry" වෙත ගොස් Save කරන්න.`);
        setReportLoading(false);
        return;
      }

      setReportFileUrl(resultDoc.fileUrl);

      const response = await fetch(resultDoc.fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawJsonData || rawJsonData.length === 0) {
        setReportError('File එකේ ශිෂ්‍ය දත්ත හමු නොවීය (Empty Sheet).');
        setReportLoading(false);
        return;
      }

      const cleanedReportData = rawJsonData.filter((row) => {
        let hasIdx = false;
        let hasName = false;

        Object.keys(row).forEach((k) => {
          const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (['indexno', 'index', 'admissionno', 'athulathankaya'].includes(cleanKey)) {
            if (String(row[k]).trim() !== '') hasIdx = true;
          }
          if (['studentname', 'name', 'nama'].includes(cleanKey)) {
            if (String(row[k]).trim() !== '') hasName = true;
          }
        });

        return hasIdx || hasName;
      });

      if (cleanedReportData.length === 0) {
        setReportError('ශිෂ්‍ය දත්ත හඳුනාගත නොහැකි විය. කරුණාකර "Result Entry" වෙතින් නැවත Save කරන්න.');
      } else {
        const sampleKeys = Object.keys(cleanedReportData[0]);
        const subjectCols = sampleKeys.filter(k => ![
          'studentname', 'name', 'nama', 'indexno', 'index', 'admissionno', 'athulathankaya',
          'grade', 'term', 'section', 'class', 'classsection', 'dob', 
          'dateofbirth', 'birthday', 'rownum', 'total', 'average', 'rank', 'place'
        ].includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')));

        // Total, Average, saha Rank enrich karanawa
        const enrichedData = enrichRowsWithRankAndStats(cleanedReportData, subjectCols);

        setReportRows(enrichedData);
        setReportAnalytics(calculateAnalytics(cleanedReportData));
      }
    } catch (err) {
      console.error('Class sheet fetch error:', err);
      setReportError(`දෝෂයක් සිදුවිය: ${err.message || 'Data ලබාගැනීමට නොහැකි විය.'}`);
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReportRows = reportRows.filter((row) => {
    const idx = String(row['Index No'] || row.IndexNo || row.AdmissionNo || row.Index || '').toLowerCase();
    const name = String(row['Student Name'] || row.StudentName || row.Name || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return idx.includes(q) || name.includes(q);
  });

  const reportSubjectColumns = reportRows.length > 0
    ? Object.keys(reportRows[0]).filter(k => ![
        'studentname', 'name', 'nama', 'indexno', 'index', 'admissionno', 'athulathankaya',
        'grade', 'term', 'section', 'class', 'classsection', 'dob', 
        'dateofbirth', 'birthday', 'rownum', 'total', 'average', 'rank', 'place',
        '__total', '__numericTotal', '__avg', '__rank'
      ].includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')))
    : [];

  const coreList = getActiveCoreSubjects();

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
    <div style={{ maxWidth: '1250px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      
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
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>ලකුණු සෘජුව ඇතුළත්/වෙනස් කරන්න හෝ පන්ති ලකුණු වාර්තාව (Class Mark Sheet) බලා Print කරගන්න.</p>
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
          onClick={() => setActiveTab('entry')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'entry' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'entry' ? '#2563eb' : '#64748b',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          📝 Result Entry (ලකුණු ඇතුළත් කිරීම)
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
        {category === 'al' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>A/L STREAM</label>
            <select value={alStream} onChange={(e) => setAlStream(e.target.value)} style={inputControlStyle}>
              <option value="maths" style={optionStyle}>Physical Science (Maths)</option>
              <option value="bio" style={optionStyle}>Biological Science</option>
              <option value="commerce" style={optionStyle}>Commerce</option>
              <option value="arts" style={optionStyle}>Arts</option>
              <option value="tech" style={optionStyle}>Technology</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: DIRECT RESULT ENTRY & EDIT VIEW */}
      {activeTab === 'entry' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
                {grade} - {classSection} ({term}) ලකුණු ලේඛනය
              </span>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {hasExistingData 
                  ? (isEditing ? '✏️ Edit Mode: අවශ්‍ය වෙනස්කම් සිදුකර "Save All Results" ඔබන්න.' : '🔒 View Mode: දත්ත සංස්කරණය කිරීමට "Edit Marks" ඔබන්න.')
                  : '✨ නව ලකුණු ඇතුළත් කිරීම (කලින් Term එකේ නම් හා අංක ස්වයංක්‍රීයව එක්විය හැක).'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {hasExistingData && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  ✏️ Edit Marks
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    + Add Student
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToSanity}
                    disabled={isUploading}
                    style={{ padding: '8px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: isUploading ? 'not-allowed' : 'pointer' }}
                  >
                    {isUploading ? 'සුරැකෙමින් පවතී...' : 'Save All Results 🚀'}
                  </button>
                </>
              )}
            </div>
          </div>

          {uploadStatus && (
            <div style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', marginBottom: '16px', backgroundColor: uploadStatus.type === 'success' ? '#f0fdf4' : '#fef2f2', color: uploadStatus.type === 'success' ? '#15803d' : '#b91c1c', border: `1px solid ${uploadStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {uploadStatus.msg}
            </div>
          )}

          {tableLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              ලකුණු සහ ශිෂ්‍ය දත්ත පූරණය වෙමින් පවතී...
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', width: '90px' }}>ඇතුළත් අංකය</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', minWidth: '150px', color: '#1e293b' }}>නම</th>
                    {coreList.map((sub) => (
                      <th key={sub} style={{ padding: '10px 6px', border: '1px solid #cbd5e1', color: '#1e293b', textAlign: 'center', minWidth: '65px' }}>{sub}</th>
                    ))}
                    {category === 'junior' && (
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', minWidth: '150px' }}>සෞන්දර්ය විෂය</th>
                    )}
                    {category === 'ol' && (
                      <>
                        <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', minWidth: '150px' }}>කාණ්ඩය 1 (Basket 1)</th>
                        <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', minWidth: '150px' }}>කාණ්ඩය 2 (Basket 2)</th>
                        <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', minWidth: '150px' }}>කාණ්ඩය 3 (Basket 3)</th>
                      </>
                    )}
                    {isEditing && <th style={{ width: '40px', border: '1px solid #cbd5e1' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.indexNo}
                            onChange={(e) => handleFieldChange(row.id, 'indexNo', e.target.value)}
                            placeholder="Index"
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', fontWeight: '700' }}
                          />
                        ) : (
                          <span style={{ fontWeight: '700', paddingLeft: '4px' }}>{row.indexNo}</span>
                        )}
                      </td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleFieldChange(row.id, 'name', e.target.value)}
                            placeholder="Student Name"
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <span style={{ fontWeight: '600', paddingLeft: '4px' }}>{row.name}</span>
                        )}
                      </td>

                      {/* Core Marks */}
                      {coreList.map((sub) => (
                        <td key={sub} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.coreMarks[sub] ?? ''}
                              onChange={(e) => handleCoreMarkChange(row.id, sub, e.target.value)}
                              placeholder="-"
                              style={{ width: '52px', padding: '6px 2px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', textAlign: 'center', fontWeight: '600' }}
                            />
                          ) : (
                            <span style={{ fontWeight: row.coreMarks[sub] === 'Ab' ? '700' : 'normal', color: row.coreMarks[sub] === 'Ab' ? '#dc2626' : 'inherit' }}>
                              {row.coreMarks[sub] !== undefined && row.coreMarks[sub] !== '' ? row.coreMarks[sub] : '-'}
                            </span>
                          )}
                        </td>
                      ))}

                      {/* Junior Aesthetics */}
                      {category === 'junior' && (
                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <select
                                value={row.baskets.b1.sub}
                                onChange={(e) => handleBasketChange(row.id, 'b1', 'sub', e.target.value)}
                                style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              >
                                <option value="">තෝරන්න</option>
                                {SUBJECT_CONFIG.junior.aesthetics.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={row.baskets.b1.mark}
                                onChange={(e) => handleBasketChange(row.id, 'b1', 'mark', e.target.value)}
                                placeholder="Mark/Ab"
                                style={{ width: '55px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}
                              />
                            </div>
                          ) : (
                            <span>{row.baskets.b1.sub ? `${row.baskets.b1.sub}: ${row.baskets.b1.mark}` : '-'}</span>
                          )}
                        </td>
                      )}

                      {/* O/L Baskets */}
                      {category === 'ol' && (
                        <>
                          {['b1', 'b2', 'b3'].map((bKey, idx) => (
                            <td key={bKey} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <select
                                    value={row.baskets[bKey].sub}
                                    onChange={(e) => handleBasketChange(row.id, bKey, 'sub', e.target.value)}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', maxWidth: '100px' }}
                                  >
                                    <option value="">තෝරන්න</option>
                                    {SUBJECT_CONFIG.ol[`basket${idx + 1}`].map((s) => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={row.baskets[bKey].mark}
                                    onChange={(e) => handleBasketChange(row.id, bKey, 'mark', e.target.value)}
                                    placeholder="Mark/Ab"
                                    style={{ width: '55px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}
                                  />
                                </div>
                              ) : (
                                <span>{row.baskets[bKey].sub ? `${row.baskets[bKey].sub}: ${row.baskets[bKey].mark}` : '-'}</span>
                              )}
                            </td>
                          ))}
                        </>
                      )}

                      {/* Delete row */}
                      {isEditing && (
                        <td style={{ textAlign: 'center', border: '1px solid #e2e8f0' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }}
                            title="Remove Student"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS MARK SHEET (REPORT VIEWER WITH TOTAL, AVERAGE & RANK) */}
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
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#0f172a' }}>
                  ලකුණු වාර්තාව - ශ්‍රේණිය {grade.replace('Grade ', '')}_{classSection} ({term})
                </h2>
              </div>

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

              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b', width: '90px' }}>ඇතුළත් අංකය</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', textAlign: 'left', minWidth: '150px', color: '#1e293b' }}>නම</th>
                      {reportSubjectColumns.map((col) => (
                        <th key={col} style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1e293b' }}>{col}</th>
                      ))}
                      {/* Added Final Columns */}
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#0f172a', backgroundColor: '#f1f5f9', width: '70px', fontWeight: '700' }}>එකතුව</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#0f172a', backgroundColor: '#f1f5f9', width: '70px', fontWeight: '700' }}>සාමාන්‍යය</th>
                      <th style={{ padding: '10px 8px', border: '1px solid #cbd5e1', color: '#1d4ed8', backgroundColor: '#eff6ff', width: '65px', fontWeight: '800' }}>ස්ථානය</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 6px', border: '1px solid #e2e8f0', fontWeight: '700' }}>
                          {row['Index No'] || row.IndexNo || row.AdmissionNo || row.Index || row.athulathankaya || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', border: '1px solid #e2e8f0', textAlign: 'left', fontWeight: '600' }}>
                          {row['Student Name'] || row.StudentName || row.Name || row.nama || '-'}
                        </td>
                        {reportSubjectColumns.map((col) => (
                          <td key={col} style={{ padding: '8px 6px', border: '1px solid #e2e8f0' }}>
                            {String(row[col] ?? '-')}
                          </td>
                        ))}
                        {/* Rendered Total, Average, and Rank */}
                        <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '700', backgroundColor: '#f8fafc' }}>
                          {row.__total}
                        </td>
                        <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '600', backgroundColor: '#f8fafc' }}>
                          {row.__avg !== '-' ? `${row.__avg}%` : '-'}
                        </td>
                        <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: '800', color: '#2563eb', backgroundColor: '#eff6ff' }}>
                          {row.__rank}
                        </td>
                      </tr>
                    ))}

                    {/* Integrated Analytics Rows */}
                    {Object.keys(reportAnalytics).length > 0 && (
                      <>
                        <tr style={{ height: '14px', backgroundColor: '#f1f5f9' }}>
                          <td colSpan={2 + reportSubjectColumns.length + 3} style={{ border: '1px solid #cbd5e1', padding: 0 }}></td>
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
                          <td colSpan={3} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}></td>
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
                          <td colSpan={3} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}></td>
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
                          <td colSpan={3} style={{ border: '1px solid #cbd5e1', backgroundColor: '#fef2f2' }}></td>
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
                          <td colSpan={3} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f0fdf4' }}></td>
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
                          <td colSpan={3} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}></td>
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
                          <td colSpan={3} style={{ border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

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