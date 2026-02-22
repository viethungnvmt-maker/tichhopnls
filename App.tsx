
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Settings, Sparkles, Key, ExternalLink, X, Check, AlertCircle, Loader2, FileDown, ChevronRight } from 'lucide-react';
import { analyzeLessonPlan, getApiKey, setApiKey, getSelectedModel, setSelectedModel } from './services/geminiService';
import { downloadAsDocx } from './services/docxService';
import { LessonPlanData } from './types';

// Danh sách môn học
const SUBJECTS = [
  'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lý', 'GDCD', 'Tin học', 'Công nghệ', 'Âm nhạc',
  'Mỹ thuật', 'Thể dục', 'Khoa học tự nhiên', 'Hoạt động trải nghiệm'
];

// Danh sách khối lớp
const GRADES = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12'
];

// Miền năng lực số
const COMPETENCIES = [
  'Khai thác dữ liệu và thông tin',
  'Giao tiếp và Hợp tác',
  'Sáng tạo nội dung số',
  'An toàn số',
  'Giải quyết vấn đề',
  'Ứng dụng AI'
];

// AI Models
const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Nhanh, ổn định' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', description: 'Mạnh mẽ nhất' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Nhanh chóng' }
];

const App: React.FC = () => {
  // Form state
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Lớp 7');
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonText, setLessonText] = useState('');
  const [ppctFile, setPpctFile] = useState<File | null>(null);
  const [originalFileBuffer, setOriginalFileBuffer] = useState<ArrayBuffer | null>(null);

  // Options
  const [includeAI, setIncludeAI] = useState(false);

  // API Key state
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [selectedModel, setSelectedModelState] = useState('gemini-2.5-flash');
  const [hasApiKey, setHasApiKey] = useState(false);

  // App state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<LessonPlanData | null>(null);
  const [error, setError] = useState('');

  // Refs
  const lessonInputRef = useRef<HTMLInputElement>(null);
  const ppctInputRef = useRef<HTMLInputElement>(null);

  // Check API key on mount
  useEffect(() => {
    const savedKey = getApiKey();
    const savedModel = getSelectedModel();
    if (savedKey) {
      setApiKeyState(savedKey);
      setHasApiKey(true);
    } else {
      setShowApiModal(true);
    }
    setSelectedModelState(savedModel);
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File, type: 'lesson' | 'ppct') => {
    if (type === 'lesson') {
      setLessonFile(file);

      // Extract text from file
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setLessonText(text);
      } else if (file.name.endsWith('.docx')) {
        // Use mammoth for docx
        const arrayBuffer = await file.arrayBuffer();
        // Lưu ArrayBuffer gốc để sử dụng khi export
        setOriginalFileBuffer(arrayBuffer);
        if ((window as any).mammoth) {
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
          setLessonText(result.value);
        }
      }
    } else {
      setPpctFile(file);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, type: 'lesson' | 'ppct') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  // Save API settings
  const handleSaveApiSettings = () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key');
      return;
    }
    setApiKey(apiKey.trim());
    setSelectedModel(selectedModel);
    setHasApiKey(true);
    setShowApiModal(false);
    setError('');
  };

  // Submit form
  const handleSubmit = async () => {
    if (!lessonText) {
      setError('Vui lòng tải lên file giáo án');
      return;
    }
    if (!hasApiKey) {
      setShowApiModal(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setLoadingProgress(0);

    const messages = [
      'Đang đọc nội dung giáo án...',
      'Đang phân tích cấu trúc giáo án...',
      'Đối chiếu với khung năng lực số...',
      'Thiết kế hoạt động tích hợp CNTT...',
      'Đang hoàn tất giáo án số hóa...'
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[msgIndex % messages.length]);
      msgIndex++;
    }, 2500);

    // Simulated progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress > 90) progress = 90;
      setLoadingProgress(Math.round(progress));
    }, 800);

    try {
      const fullContent = `Môn học: ${subject}\nKhối lớp: ${grade}\n\nNội dung giáo án:\n${lessonText}`;
      const data = await analyzeLessonPlan(fullContent);
      setLoadingProgress(100);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(message);
    } finally {
      setIsLoading(false);
      clearInterval(interval);
      clearInterval(progressInterval);
    }
  };

  // Render result view
  if (result) {
    return (
      <div className="app-container">
        <header className="header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <Sparkles size={24} color="white" />
              </div>
              <div className="logo-text">
                <h1>SOẠN GIÁO ÁN NĂNG LỰC SỐ</h1>
                <p>Hỗ trợ tích hợp Năng lực số toàn cấp bởi Nguyễn Việt Hùng</p>
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="form-card animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#60a5fa' }}>
                ✅ {result.title}
              </h2>
              <button
                onClick={() => setResult(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #3b82f6',
                  color: '#3b82f6',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Soạn giáo án mới
              </button>
            </div>

            {result.summary && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                <p style={{ color: '#e2e8f0' }}>{result.summary}</p>
              </div>
            )}

            <div className="section-title">Mục tiêu năng lực số</div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {result.digitalGoals.map((goal, idx) => (
                <li key={idx} style={{ display: 'flex', gap: '10px', padding: '0.75rem 0', borderBottom: '1px solid #1e3a5f' }}>
                  <span style={{ color: '#22c55e' }}>✓</span>
                  <span style={{ color: '#e2e8f0' }}>{goal.description}</span>
                </li>
              ))}
            </ul>

            <div className="section-title">Hoạt động tích hợp CNTT</div>
            {result.activities.map((activity, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e3a5f' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ color: '#fbbf24', margin: 0 }}>{activity.name}</h4>
                  {activity.nlsType && (
                    <span style={{
                      padding: '2px 10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: '#ef4444'
                    }}>
                      {activity.nlsType}
                    </span>
                  )}
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{activity.digitalActivity}</p>
                {activity.digitalTools && activity.digitalTools.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {activity.digitalTools.map((tool, i) => (
                      <span key={i} style={{
                        padding: '4px 12px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        color: '#60a5fa'
                      }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {result.recommendedTools && result.recommendedTools.length > 0 && (
              <>
                <div className="section-title">Công cụ số khuyến nghị</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {result.recommendedTools.map((tool, idx) => (
                    <span key={idx} style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      borderRadius: '25px',
                      fontSize: '0.875rem',
                      color: 'white'
                    }}>
                      {tool}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Success Message Section */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Check size={32} color="white" />
              </div>
              <h3 style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Phân tích giáo án thành công!
              </h3>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                Đã tạo <strong style={{ color: '#60a5fa' }}>{result.activities?.length || 0} phần</strong> nội dung NLS để chèn vào giáo án.
              </p>

              {/* Info badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                  padding: '12px 20px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                  color: '#22c55e',
                  fontSize: '0.875rem'
                }}>
                  ✓ XML Injection: Chèn NLS vào <strong>nhiều vị trí</strong> trong file gốc
                </div>
                <div style={{
                  padding: '12px 20px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.875rem'
                }}>
                  🚀 Nội dung NLS: <strong>màu đỏ</strong>{includeAI && <> • Năng lực AI: <strong>màu xanh lam</strong></>} • Phân bổ vào: Mục tiêu + Các Hoạt động
                </div>
              </div>

              {/* Download Section */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={async () => {
                    if (result) {
                      const originalFileName = lessonFile?.name || '';
                      await downloadAsDocx(result, includeAI, lessonText, originalFileBuffer || undefined, originalFileName);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 48px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FileDown size={20} />
                  Tải về .docx
                </button>
              </div>

              {includeAI && (
                <p style={{
                  marginTop: '1rem',
                  color: '#22c55e',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  ✓ Đã bật tích hợp Năng lực trí tuệ nhân tạo
                </p>
              )}

              {/* Preview toggle */}
              <button
                style={{
                  marginTop: '1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '1.5rem auto 0',
                  fontSize: '0.875rem'
                }}
              >
                Xem trước nội dung ({result.activities?.length || 0} phần)
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render main form
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Sparkles size={24} color="white" />
            </div>
            <div className="logo-text">
              <h1>SOẠN GIÁO ÁN NĂNG LỰC SỐ</h1>
              <p>Hỗ trợ tích hợp Năng lực số toàn cấp</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="api-key-btn" onClick={() => setShowApiModal(true)}>
              <Key size={16} />
              Lấy API key để sử dụng app
              <Settings size={16} />
            </button>
            <div className="powered-by">
              <Sparkles size={16} />
              Powered by Gemini
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Form Section */}
        <div className="form-card animate-fadeIn">
          {/* Thông tin kế hoạch bài dạy */}
          <div className="section-title">Thông tin Kế hoạch bài dạy</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Môn học</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Khối lớp</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                {GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tài liệu đầu vào */}
          <div className="upload-section">
            <div className="section-title">Tài liệu đầu vào</div>
            <div className="upload-grid">
              {/* File Giáo án */}
              <div>
                <p className="upload-label required">File Giáo án</p>
                <div
                  className={`upload-box ${lessonFile ? 'active' : ''}`}
                  onClick={() => lessonInputRef.current?.click()}
                  onDrop={(e) => handleDrop(e, 'lesson')}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="upload-icon">
                    {lessonFile ? <Check size={24} /> : <Upload size={24} />}
                  </div>
                  <p className="upload-title">
                    {lessonFile ? lessonFile.name : 'Tải lên Giáo án'}
                  </p>
                  <p className="upload-desc">
                    {lessonFile ? 'Đã tải lên thành công' : 'Giáo án bài dạy cần tích hợp'}
                  </p>
                  <span className="upload-formats">Hỗ trợ .docx, .pdf</span>
                  {!lessonFile && <p className="required-badge">⊙ Bắt buộc</p>}
                </div>
                <input
                  ref={lessonInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'lesson')}
                />
              </div>

              {/* File PPCT */}
              <div>
                <p className="upload-label">File Phân phối chương trình</p>
                <div
                  className={`upload-box ${ppctFile ? 'active' : ''}`}
                  onClick={() => ppctInputRef.current?.click()}
                  onDrop={(e) => handleDrop(e, 'ppct')}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="upload-icon">
                    {ppctFile ? <Check size={24} /> : <FileText size={24} />}
                  </div>
                  <p className="upload-title">
                    {ppctFile ? ppctFile.name : 'Tải lên PPCT'}
                  </p>
                  <p className="upload-desc">Tài liệu tham khảo năng lực (nếu có)</p>
                  <span className="upload-formats">Hỗ trợ .docx, .pdf</span>
                  <p className="optional-text">Tùy chọn, Giúp AI xác định năng lực chính xác hơn</p>
                </div>
                <input
                  ref={ppctInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'ppct')}
                />
              </div>
            </div>
          </div>

          {/* Tùy chọn nâng cao */}
          <div className="advanced-options">
            <div className="advanced-title">
              <Settings size={16} />
              Tùy chọn nâng cao
            </div>
            <div className="checkbox-group">
              <label className="checkbox-item ai-option">
                <input
                  type="checkbox"
                  checked={includeAI}
                  onChange={(e) => setIncludeAI(e.target.checked)}
                />
                <div>
                  <span className="ai-option-title">Thêm năng lực trí tuệ nhân tạo vào giáo án</span>
                  <span className="ai-option-desc">AI sẽ phân tích và gán năng lực AI phù hợp vào các hoạt động dạy học (hiển thị màu xanh lam)</span>
                </div>
              </label>
            </div>
          </div>

          {/* API Key Link */}
          <div className="api-key-link" onClick={() => setShowApiModal(true)}>
            <Key size={14} />
            Cấu hình API Key
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ef4444'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!lessonFile || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="spin-animation" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                BẮT ĐẦU SOẠN GIÁO ÁN
              </>
            )}
          </button>

          {/* Inline Loading Progress */}
          {isLoading && (
            <div className="form-card animate-fadeIn" style={{ textAlign: 'center', padding: '2.5rem 2rem', marginTop: '1.5rem' }}>
              {/* Circular progress */}
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1.5rem' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1e3a5f" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - loadingProgress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#60a5fa'
                }}>
                  {loadingProgress}%
                </div>
              </div>

              {/* Linear progress bar */}
              <div style={{
                width: '80%',
                height: '6px',
                background: '#1e3a5f',
                borderRadius: '3px',
                margin: '0 auto 1.5rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${loadingProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>

              {/* Status text */}
              <h3 style={{ color: '#e2e8f0', fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {loadingMessage}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Powered by Gemini AI
              </p>
              <p style={{ color: '#fbbf24', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                💡 Vui lòng không đóng trang này
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Hướng dẫn nhanh */}
          <div className="guide-card">
            <h3 className="guide-title">Hướng dẫn nhanh</h3>
            <ul className="guide-list">
              <li className="guide-item">
                <span className="guide-number">1</span>
                <span className="guide-text">Chọn môn học và khối lớp.</span>
              </li>
              <li className="guide-item">
                <span className="guide-number">2</span>
                <div>
                  <span className="guide-text"><strong>Bắt buộc:</strong> Tải lên file giáo án (docx hoặc pdf).</span>
                </div>
              </li>
              <li className="guide-item">
                <span className="guide-number">3</span>
                <div>
                  <span className="guide-text guide-note">Tùy - Tải file PPCT nếu muốn AI tham khảo năng lực cụ thể của trường.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Miền năng lực số */}
          <div className="competency-card">
            <h3 className="competency-title">Miền năng lực số</h3>
            <ul className="competency-list">
              {COMPETENCIES.map((comp, idx) => (
                <li key={idx} className="competency-item">{comp}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="promo-banner">
          <p className="promo-text">
            ĐĂNG KÝ KHOÁ HỌC THỰC CHIẾN VIẾT SKKN, TẠO APP DẠY HỌC, TẠO MÔ PHỎNG TRỰC QUAN
          </p>
          <p className="promo-highlight">CHỈ VỚI 1 CÂU LỆNH</p>
          <a href="https://web.facebook.com/viethungnvmt/" target="_blank" rel="noopener noreferrer" className="promo-btn">ĐĂNG KÝ NGAY</a>
        </div>
        <p className="contact-info">
          Mọi thông tin vui lòng liên hệ: <br />
          <strong>Facebook:</strong> <a href="https://facebook.com/viethungnvmt" target="_blank" rel="noopener noreferrer">@viethungnvmt</a> • <strong>Zalo:</strong> <a href="tel:0363831337">036.38.31.337</a>
        </p>
      </footer>

      {/* API Key Modal */}
      {showApiModal && (
        <div className="modal-overlay" onClick={() => hasApiKey && setShowApiModal(false)}>
          <div className="modal-content animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cấu hình API Key</h3>
              {hasApiKey && (
                <button className="modal-close" onClick={() => setShowApiModal(false)}>
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Google AI API Key <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyState(e.target.value)}
                  placeholder="AIza..."
                />
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '0.5rem',
                    color: '#60a5fa',
                    fontSize: '0.875rem',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={14} />
                  Lấy API Key miễn phí tại Google AI Studio
                </a>
              </div>

              <div className="form-group">
                <label>Chọn Model AI</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {AI_MODELS.map((model) => (
                    <label
                      key={model.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: selectedModel === model.id ? 'rgba(59, 130, 246, 0.2)' : '#0f172a',
                        border: `1px solid ${selectedModel === model.id ? '#3b82f6' : '#1e3a5f'}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="model"
                        checked={selectedModel === model.id}
                        onChange={() => setSelectedModelState(model.id)}
                        style={{ accentColor: '#3b82f6' }}
                      />
                      <div>
                        <p style={{ color: '#e2e8f0', fontWeight: '500' }}>{model.name}</p>
                        <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{model.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="submit-btn" onClick={handleSaveApiSettings}>
                Lưu và tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
