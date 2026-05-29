'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/attendance-management-app/backend/php';

  const API = {
    lessons: `${API_BASE}/get_lessons.php`,
    summary: `${API_BASE}/get_subject_attendance_summary.php`,
  };

  const termSelect = document.getElementById('termSelect');
  const subjectSelect = document.getElementById('subjectSelect');
  const subjectTitle = document.getElementById('subjectTitle');
  const tableBody = document.getElementById('studentTableBody');

  let lessonsCache = [];

  initialize();

  async function initialize() {
    try {
      setDefaultTermByToday();
      bindEvents();
      await loadLessons();
      await loadAttendanceTable();
    } catch (error) {
      console.error('初期化エラー:', error);
      renderError('初期化に失敗しました');
    }
  }

  function bindEvents() {
    termSelect?.addEventListener('change', loadAttendanceTable);
    subjectSelect?.addEventListener('change', loadAttendanceTable);
  }

  function setDefaultTermByToday() {
    const today = new Date();
    const month = today.getMonth() + 1;

    termSelect.value = (month >= 4 && month <= 9) ? '前期' : '後期';
  }

  async function loadLessons() {
    showLoading('科目一覧を読み込み中...');

    const data = await fetchJson(API.lessons);

    if (!data.success || !Array.isArray(data.lessons)) {
      throw new Error(data.message || '科目一覧の取得に失敗しました');
    }

    lessonsCache = data.lessons;
    populateSubjectOptions(lessonsCache);
  }

  function populateSubjectOptions(lessons) {
    if (!subjectSelect) return;

    subjectSelect.innerHTML = '<option value="">科目を選択してください</option>';

    lessons.forEach((lesson) => {
      const option = document.createElement('option');
      option.value = String(lesson.lesson_id);
      option.textContent = lesson.lesson_name ?? '';
      subjectSelect.appendChild(option);
    });
  }

  async function loadAttendanceTable() {
    const term = termSelect?.value ?? '';
    const lessonId = subjectSelect?.value ?? '';

    updateSubjectTitle();

    if (!lessonId) {
      renderMessage('科目を選択してください');
      return;
    }

    try {
      showLoading('読み込み中...');

      const url = new URL(API.summary, window.location.origin);
      url.searchParams.set('term', term);
      url.searchParams.set('lesson_id', lessonId);

      const data = await fetchJson(url.toString());

      if (!data.success) {
        throw new Error(data.message || '集計データの取得に失敗しました');
      }

      renderTable(data.students || []);
    } catch (error) {
      console.error('集計取得エラー:', error);
      renderError('データの取得に失敗しました');
    }
  }

  function updateSubjectTitle() {
    if (!subjectTitle || !subjectSelect) return;

    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
    const selectedText = selectedOption ? selectedOption.textContent : '未選択';

    subjectTitle.textContent =
      subjectSelect.value && selectedText ? selectedText : '未選択';
  }

  function renderTable(students) {
    tableBody.innerHTML = '';

    if (!Array.isArray(students) || students.length === 0) {
      renderMessage('対象データがありません');
      return;
    }

    const rowsHtml = students.map((student) => {
      const attended = Number(student.attended_classes) || 0;
      const completed = Number(student.completed_classes) || 0;
      const total = Number(student.total_classes) || 0;
      const required = Number(student.required_classes) || 0;
      const attendanceRate = calcAttendanceRate(attended, completed);

      const rateColor = attendanceRate < 67 ? '#ff0000' : '#000000';

      return `
        <tr>
          <td>${escapeHtml(student.student_id ?? '')}</td>
          <td>${escapeHtml(student.student_name ?? '')}</td>
          <td>${attended}</td>
          <td>${completed}</td>
          <td>${total}</td>
          <td>${required}</td>
          <td style="font-weight:bold; color:${rateColor};">
            ${attendanceRate}%
          </td>
        </tr>
      `;
    }).join('');

    tableBody.innerHTML = rowsHtml;
  }

  function renderMessage(message) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:20px;">
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  function renderError(message) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:red; padding:20px;">
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  function showLoading(message = '読み込み中...') {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:20px;">
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  function calcAttendanceRate(attended, completed) {
    if (!completed) return 0;
    return Math.round((attended / completed) * 100);
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    return response.json();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});