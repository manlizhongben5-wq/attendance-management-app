'use strict';

/**
 * 編集画面から離れる時（タブ閉じ、他ページ遷移）にロックを解除する
 */
window.addEventListener('pagehide', () => {
  navigator.sendBeacon('/attendance-management-app/backend/php/manage_editor.php?action=unlock');
});

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = '/attendance-management-app/backend/php';

  const API = {
    classes: `${API_BASE}/get_classes.php`,
    lessons: `${API_BASE}/get_lessons.php`,
    students: `${API_BASE}/get_students.php`,
    attendances: `${API_BASE}/get_attendances.php`,
    saveAttendances: `${API_BASE}/save_attendances.php`,
  };

  const STATUS_DEFS = [
    { value: 'unselected', label: '未選択', className: 'status-unselected' },
    { value: 'present', label: '出席', className: 'status-present' },
    { value: 'absent', label: '欠席', className: 'status-absent' },
    { value: 'late', label: '遅刻', className: 'status-late' },
    { value: 'leave', label: '早退', className: 'status-leave' },
    { value: 'official', label: '公欠', className: 'status-official' },
    { value: 'separate', label: '別室', className: 'status-separate' },
  ];

  const state = {
    classes: [],
    students: [],
    lessons: [],
    attendanceMap: {},
    dirty: false,
    loading: false,
  };

  const tbody = document.getElementById('attendanceTable');
  const gradeSelect = document.getElementById('grade');
  const periodSelect = document.getElementById('period');
  const subjectSelect = document.getElementById('subject');
  const summaryRow = document.getElementById('summaryRow');
  const courseOptions = document.getElementById('courseOptions');
  const selectAllPresentBtn = document.getElementById('selectAllPresentBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const backBtn = document.querySelector('.back-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const targetDateInput = document.getElementById('targetDate');
  const saveBtn = document.getElementById('saveAttendanceBtn');

  /**
   * ロック解除（アンロック）を実行する共通関数
   */
  const triggerUnlock = () => {
    console.log('アンロックリクエストを送信します...');
    navigator.sendBeacon('/attendance-management-app/backend/php/manage_editor.php?action=unlock');
  };

  /**
   * 戻るボタン
   */
  if (backBtn) {
    backBtn.addEventListener('click', (event) => {
      if (state.dirty) {
        if (!window.confirm('保存していない変更があります。破棄してもよろしいですか？')) {
          event.preventDefault();
          return;
        }
      }

      console.log('戻るによるアンロック実行');
      triggerUnlock();
    });
  } else {
    console.error('戻るボタン (.back-btn) が見つかりません');
  }

  /**
   * ログアウトボタン
   */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('ログアウトによるアンロック実行');
      triggerUnlock();
    });
  } else {
    console.error('ログアウトボタン (#logout-btn) が見つかりません');
  }

  /**
   * ページ離脱前の警告
   */
  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  if (!tbody) {
    console.error('tbody が見つかりません。');
    return;
  }

  function setDirty(flag) {
    state.dirty = flag;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getSelectedDate() {
    return targetDateInput?.value || '';
  }

  function getSelectedPeriodNumber() {
    const text = periodSelect?.value || '1限';
    const match = text.match(/\d+/);
    return match ? Number(match[0]) : 1;
  }

  function getBaseSchoolYear() {
    const selectedDate = getSelectedDate();

    if (!selectedDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      return month >= 4 ? year : year - 1;
    }

    const date = new Date(`${selectedDate}T00:00:00`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return month >= 4 ? year : year - 1;
  }

  function getEnrollmentYearByGrade(grade) {
    const baseSchoolYear = getBaseSchoolYear();

    if (grade === '1') return baseSchoolYear;
    if (grade === '2') return baseSchoolYear - 1;

    return baseSchoolYear;
  }

  function fetchClassLabelFromRow(classRow) {
    return classRow.class_name ?? `学科${classRow.class_id ?? ''}`;
  }

  function renderCourseOptions(classes) {
    if (!courseOptions) return;

    if (!classes.length) {
      courseOptions.innerHTML = '<span>学科データがありません。</span>';
      return;
    }

    courseOptions.innerHTML = classes.map((classRow, index) => {
      const classId = Number(classRow.class_id ?? 0);
      const label = fetchClassLabelFromRow(classRow);

      return `
        <label class="radio-inline">
          <input
            type="radio"
            name="course"
            value="${escapeHtml(classId)}"
            data-class-id="${escapeHtml(classId)}"
            ${index === 0 ? 'checked' : ''}
          />
          <span>${escapeHtml(label)}</span>
        </label>
      `;
    }).join('');
  }

  function getSelectedCourseRadio() {
    return document.querySelector('input[name="course"]:checked');
  }

  function getSelectedClassId() {
    const checked = getSelectedCourseRadio();
    if (!checked) return 0;
    return Number(checked.dataset.classId || checked.value || 0);
  }

  function getSelectedCourseLabel() {
    const checked = getSelectedCourseRadio();
    if (!checked) return '';
    const span = checked.closest('label')?.querySelector('span');
    return span ? span.textContent.trim() : '';
  }

  function getSelectedLessonName() {
    if (!subjectSelect) return '';
    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
    return selectedOption ? selectedOption.textContent.trim() : '';
  }

  function getCurrentFilter() {
    const grade = gradeSelect?.value || '1';

    return {
      grade,
      course: getSelectedCourseLabel(),
      enrollment_year: getEnrollmentYearByGrade(grade),
      class_id: getSelectedClassId(),
      date: getSelectedDate(),
      period: getSelectedPeriodNumber(),
      lesson_id: Number(subjectSelect?.value || 0),
      lesson_name: getSelectedLessonName(),
    };
  }

  function getRowStatusClass(statusValue) {
    const found = STATUS_DEFS.find((s) => s.value === statusValue);
    return found ? found.className : 'status-unselected';
  }

  function getRowSelectedStatus(tr) {
    const checked = tr.querySelector('input[type="radio"]:checked');
    return checked ? checked.value : 'unselected';
  }

  function applyRowStatusClass(tr, statusValue) {
    STATUS_DEFS.forEach((s) => tr.classList.remove(s.className));
    tr.classList.add(getRowStatusClass(statusValue));
  }

  function updateSummary() {
    const counts = {
      unselected: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      official: 0,
      separate: 0,
    };

    const rows = tbody.querySelectorAll('tr.attendance-row');
    rows.forEach((tr) => {
      const status = getRowSelectedStatus(tr);
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    if (summaryRow) {
      summaryRow.textContent =
        `未選択: ${counts.unselected} ` +
        `出席: ${counts.present} ` +
        `欠席: ${counts.absent} ` +
        `遅刻: ${counts.late} ` +
        `早退: ${counts.leave} ` +
        `公欠: ${counts.official} ` +
        `別室: ${counts.separate}`;
    }
  }

  function populateSubjectOptions(lessons) {
    if (!subjectSelect) return;

    subjectSelect.innerHTML = `
      <option value="">科目を選択</option>
      ${lessons.map((lesson) => `
        <option value="${lesson.lesson_id}">
          ${escapeHtml(lesson.lesson_name)}
        </option>
      `).join('')}
    `;
  }

  function renderTable(students, attendanceMap = {}) {
    if (!students.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; padding:20px;">
            学生データがありません。
          </td>
        </tr>
      `;
      updateSummary();
      return;
    }

    tbody.innerHTML = students.map((student) => {
      const studentId = String(student.student_id);
      const selectedStatus = attendanceMap[studentId] || 'unselected';

      return `
        <tr class="attendance-row ${getRowStatusClass(selectedStatus)}" data-student-id="${studentId}">
          <td>${escapeHtml(student.student_number ?? student.student_id)}</td>
          <td>${escapeHtml(student.student_name ?? '')}</td>
          <td>
            <div class="attendance-options">
              ${STATUS_DEFS.map((status) => `
                <label class="radio-inline">
                  <input
                    type="radio"
                    name="attendance_${studentId}"
                    value="${status.value}"
                    ${selectedStatus === status.value ? 'checked' : ''}
                  />
                  <span>${escapeHtml(status.label)}</span>
                </label>
              `).join('')}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    updateSummary();
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    console.log(`APIリクエスト: ${options.method || 'GET'} ${url}`, res);

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('サーバーからJSONを取得できませんでした。PHPの出力を確認してください。');
    }

    if (!res.ok) {
      const detailText = Array.isArray(data?.details) ? `\n${data.details.join('\n')}` : '';
      throw new Error((data?.message || `HTTPエラー: ${res.status}`) + detailText);
    }

    if (data && data.success === false) {
      const detailText = Array.isArray(data?.details) ? `\n${data.details.join('\n')}` : '';
      throw new Error((data.message || 'サーバー処理に失敗しました。') + detailText);
    }

    return data;
  }

  async function fetchClasses() {
    const data = await fetchJson(API.classes);
    return data.classes || [];
  }

  async function fetchLessons() {
    const data = await fetchJson(API.lessons);
    return data.lessons || [];
  }

  async function fetchStudents({ enrollment_year, class_id } = {}) {
    if (!enrollment_year || !class_id) {
      return [];
    }

    const url =
      `${API.students}?enrollment_year=${encodeURIComponent(enrollment_year)}` +
      `&class_id=${encodeURIComponent(class_id)}`;

    const data = await fetchJson(url);
    return data.students || [];
  }

  async function fetchAttendances({ date, period, lesson_id } = {}) {
    if (!date || !period || !lesson_id) {
      return {};
    }

    const params = new URLSearchParams({
      date: String(date),
      period: String(period),
      lesson_id: String(lesson_id),
    });

    const url = `${API.attendances}?${params.toString()}`;
    const data = await fetchJson(url);

    const map = {};
    (data.attendances || []).forEach((row) => {
      map[String(row.student_id)] = row.status;
    });

    return map;
  }

  async function saveAttendances(payload) {
    return await fetchJson(API.saveAttendances, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  function collectAttendancePayload(confirmOverwrite = false) {
    const filter = getCurrentFilter();

    const items = Array.from(tbody.querySelectorAll('tr.attendance-row')).map((tr) => {
      const studentId = String(tr.dataset.studentId);
      const status = getRowSelectedStatus(tr);

      return {
        student_id: studentId,
        status,
      };
    });

    return {
      date: filter.date,
      period: filter.period,
      lesson_id: filter.lesson_id,
      confirm_overwrite: confirmOverwrite,
      items,
    };
  }

  function buildConfirmMessage(result) {
    const baseMessage = result?.message || 'すでに登録されている出欠データがあります。更新しますか？';
    const affectedCount = Number(result?.affected_count || 0);
    const lessons = Array.isArray(result?.existing_lessons) ? result.existing_lessons : [];

    let lessonLine = '登録済み科目：なし';

    if (lessons.length > 0) {
      if (lessons.length <= 3) {
        lessonLine = `登録済み科目：${lessons.join('、')}`;
      } else {
        lessonLine = `登録済み科目：${lessons.slice(0, 3).join('、')} ほか`;
      }
    }

    return [
      baseMessage,
      `上書き・削除対象: ${affectedCount}件`,
      lessonLine,
    ].join('\n');
  }

  async function executeSaveWithConfirm() {
    const firstPayload = collectAttendancePayload(false);
    console.log('save payload:', firstPayload);

    if (!firstPayload.lesson_id) {
      alert('科目を選択してください。');
      return false;
    }

    const firstResult = await saveAttendances(firstPayload);

    if (firstResult?.confirm_required) {
      const confirmMessage = buildConfirmMessage(firstResult);
      const ok = window.confirm(confirmMessage);

      if (!ok) {
        return false;
      }

      const secondPayload = collectAttendancePayload(true);
      console.log('save payload retry:', secondPayload);

      const secondResult = await saveAttendances(secondPayload);

      if (secondResult?.success) {
        return true;
      }

      throw new Error(secondResult?.message || '保存に失敗しました。');
    }

    return !!firstResult?.success;
  }

  async function loadScreenData({ reloadStudents = true } = {}) {
    if (state.loading) return;

    state.loading = true;

    try {
      const filter = getCurrentFilter();
      console.log('現在の絞り込み条件:', filter);

      if (reloadStudents) {
        state.students = await fetchStudents({
          enrollment_year: filter.enrollment_year,
          class_id: filter.class_id,
        });
        console.log('取得した学生一覧:', state.students);
      }

      if (filter.lesson_id) {
        state.attendanceMap = await fetchAttendances({
          date: filter.date,
          period: filter.period,
          lesson_id: filter.lesson_id,
        });
      } else {
        state.attendanceMap = {};
      }

      console.log('取得した出欠データ:', state.attendanceMap);

      renderTable(state.students, state.attendanceMap);
      setDirty(false);
    } catch (error) {
      console.error(error);
      alert(error.message || '画面データの読込に失敗しました。');
    } finally {
      state.loading = false;
    }
  }

  tbody.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'radio') return;

    const tr = target.closest('tr.attendance-row');
    if (!tr) return;

    applyRowStatusClass(tr, target.value);
    setDirty(true);
    updateSummary();
  });

  if (courseOptions) {
    courseOptions.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== 'course') return;

      loadScreenData({ reloadStudents: true });
    });
  }

  if (selectAllPresentBtn) {
    selectAllPresentBtn.addEventListener('click', () => {
      const rows = tbody.querySelectorAll('tr.attendance-row');
      rows.forEach((tr) => {
        const radio = tr.querySelector('input[type="radio"][value="present"]');
        if (radio) {
          radio.checked = true;
          applyRowStatusClass(tr, 'present');
        }
      });
      setDirty(true);
      updateSummary();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      const rows = tbody.querySelectorAll('tr.attendance-row');
      rows.forEach((tr) => {
        const radio = tr.querySelector('input[type="radio"][value="unselected"]');
        if (radio) {
          radio.checked = true;
          applyRowStatusClass(tr, 'unselected');
        }
      });
      setDirty(true);
      updateSummary();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      try {
        const saved = await executeSaveWithConfirm();

        if (!saved) {
          return;
        }

        setDirty(false);
        await loadScreenData({ reloadStudents: false });
        alert('出欠状況を保存しました。');
      } catch (error) {
        console.error(error);
        alert(error.message || '保存に失敗しました。');
      }
    });
  }

  if (gradeSelect) {
    gradeSelect.addEventListener('change', () => loadScreenData({ reloadStudents: true }));
  }

  if (periodSelect) {
    periodSelect.addEventListener('change', () => loadScreenData({ reloadStudents: false }));
  }

  if (subjectSelect) {
    subjectSelect.addEventListener('change', () => loadScreenData({ reloadStudents: false }));
  }

  if (targetDateInput) {
    targetDateInput.addEventListener('change', () => loadScreenData({ reloadStudents: true }));
  }

  if (targetDateInput && !targetDateInput.value) {
    targetDateInput.valueAsDate = new Date();
  }

  try {
    state.classes = await fetchClasses();
    console.log('取得した学科一覧:', state.classes);
    renderCourseOptions(state.classes);

    state.lessons = await fetchLessons();
    console.log('取得した科目一覧:', state.lessons);
    populateSubjectOptions(state.lessons);

    await loadScreenData({ reloadStudents: true });
  } catch (error) {
    console.error(error);
    alert('初期表示に失敗しました。');
  }

  /**
   * ==========================================
   * アイドルタイマー（タイムアウト）処理
   * ==========================================
   * 15分以上操作がなければ解除
   */
  let lastActivityTime = Date.now();

  const updateActivity = () => {
    lastActivityTime = Date.now();
  };

  window.addEventListener('click', updateActivity);
  window.addEventListener('keydown', updateActivity);
  window.addEventListener('mousemove', updateActivity);
  window.addEventListener('touchstart', updateActivity);

  const CHECK_INTERVAL = 10000; // 10秒
  const IDLE_LIMIT = 15 * 60 * 1000; // 15分

  setInterval(() => {
    const now = Date.now();
    const diff = now - lastActivityTime;

    console.log(`点検中... 最後の操作から ${Math.floor(diff / 1000)}秒 経過`);

    if (diff > IDLE_LIMIT) {
      console.log('タイムアウト実行！');
      navigator.sendBeacon('/attendance-management-app/backend/php/manage_editor.php?action=unlock');
      alert('15分間操作がなかったため、解除しました。');
      window.location.href = '/attendance-management-app/public/pages/teacher/teacher_dashboard.html';
    }
  }, CHECK_INTERVAL);
});