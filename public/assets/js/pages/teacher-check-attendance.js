document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("targetDate");
  const gradeSelect = document.getElementById("grade");
  const exportBtn = document.getElementById("exportBtn");
  const tableBody = document.getElementById("attendanceTable");
  const courseOptions = document.getElementById("courseOptions");

  const API_BASE = "/attendance/backend/php";

  const API = {
    classes: `${API_BASE}/get_classes.php`,
    summary: `${API_BASE}/get_attendance_summary.php`,
    fiscalYearExport: `${API_BASE}/get_attendance_fiscal_year_export.php`,
  };

  const USE_DUMMY_DATA = false;

  let cachedClasses = [];
  let lastLoadedData = null;

  initialize();

  async function initialize() {
    try {
      if (dateInput) {
        dateInput.valueAsDate = new Date();
      }

      await loadClasses();
      bindEvents();
      await loadAttendanceTable();
    } catch (error) {
      console.error(error);
      showError(tableBody, "初期化に失敗しました。", 9);
    }
  }

  function bindEvents() {
    dateInput?.addEventListener("change", loadAttendanceTable);
    gradeSelect?.addEventListener("change", loadAttendanceTable);
    exportBtn?.addEventListener("click", exportAttendanceToExcel);
  }

  async function loadClasses() {
    if (!courseOptions) return;

    courseOptions.innerHTML = `<span class="course-loading">読み込み中...</span>`;

    let data;

    if (USE_DUMMY_DATA) {
      data = {
        success: true,
        classes: [
          { class_id: 1, class_name: "情報システム" },
          { class_id: 2, class_name: "医療ビジネス" },
          { class_id: 3, class_name: "情報ビジネス" },
          { class_id: 4, class_name: "公務員" },
        ],
      };
    } else {
      const response = await fetch(API.classes, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`学科一覧取得失敗: ${response.status}`);
      }

      data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "学科一覧の取得に失敗しました。");
      }
    }

    const classes = Array.isArray(data.classes) ? data.classes : [];
    cachedClasses = classes;
    renderClassOptions(classes);
  }

  function renderClassOptions(classes) {
    if (!courseOptions) return;

    if (classes.length === 0) {
      courseOptions.innerHTML = `<span class="course-loading">学科データがありません</span>`;
      return;
    }

    courseOptions.innerHTML = classes
      .map((cls, index) => {
        const checked = index === 0 ? "checked" : "";
        return `
          <label class="radio-inline">
            <input type="radio" name="course" value="${escapeHtml(String(cls.class_id))}" ${checked} />
            <span>${escapeHtml(cls.class_name ?? "")}</span>
          </label>
        `;
      })
      .join("");

    document.querySelectorAll('input[name="course"]').forEach((radio) => {
      radio.addEventListener("change", loadAttendanceTable);
    });
  }

  function getSearchParams() {
    const date = dateInput?.value || "";
    const grade = gradeSelect?.value || "";
    const classId = document.querySelector('input[name="course"]:checked')?.value || "";

    return {
      date,
      grade,
      classId,
    };
  }

  async function fetchAttendanceSummary(params) {
    if (USE_DUMMY_DATA) {
      await wait(150);

      const classInfo = cachedClasses.find((item) => String(item.class_id) === String(params.classId));
      const className = classInfo?.class_name ?? "";

      return getDummyAttendanceData({
        date: params.date,
        grade: params.grade,
        classId: params.classId,
        className,
      });
    }

    const query = new URLSearchParams({
      date: params.date,
      grade: params.grade,
      class_id: params.classId,
    });

    const response = await fetch(`${API.summary}?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || `データ取得失敗: ${response.status}`;
      const detail = data?.error ? ` / ${data.error}` : "";
      throw new Error(message + detail);
    }

    if (!data || !data.success) {
      throw new Error(data?.message || "APIエラー");
    }

    return data;
  }

  async function loadAttendanceTable() {
    const params = getSearchParams();

    if (!params.date || !params.grade || !params.classId) {
      showError(tableBody, "日付・学年・学科を選択してください。", 9);
      return;
    }

    try {
      showLoading(tableBody);

      const data = await fetchAttendanceSummary(params);
      lastLoadedData = data;

      renderAttendanceTable(tableBody, data);
    } catch (error) {
      console.error(error);
      lastLoadedData = null;
      showError(tableBody, error.message || "出欠データの取得に失敗しました。", 9);
    }
  }

  function showLoading(tbodyEl) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:16px;">
          読み込み中...
        </td>
      </tr>
    `;
  }

  function showError(tbodyEl, message, colSpan = 9) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="${colSpan}" style="text-align:center; padding:16px; color:red;">
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  function renderAttendanceTable(tbodyEl, data) {
    const periods = Array.isArray(data.periods) ? data.periods : [];
    const students = Array.isArray(data.students) ? data.students : [];
    const colSpan = 1 + periods.length * 2;

    if (students.length === 0) {
      tbodyEl.innerHTML = `
        <tr>
          <td colspan="${colSpan}" style="text-align:center; padding:16px;">
            対象データがありません
          </td>
        </tr>
      `;
      return;
    }

    tbodyEl.innerHTML = students
      .map((student) => {
        const cells = periods
          .map((period) => {
            const item = student.attendance?.[String(period)] || {};
            const subject = item.subject ?? "";
            const status = item.status ?? "";

            return `
              <td>${escapeHtml(subject)}</td>
              <td>${escapeHtml(status)}</td>
            `;
          })
          .join("");

        return `
          <tr>
            <td>${escapeHtml(student.studentName ?? "")}</td>
            ${cells}
          </tr>
        `;
      })
      .join("");
  }

  async function exportAttendanceToExcel() {
    try {
      if (typeof ExcelJS === "undefined") {
        throw new Error("ExcelJSが読み込まれていません。HTMLに script タグを追加してください。");
      }

      if (typeof saveAs === "undefined") {
        throw new Error("FileSaverが読み込まれていません。HTMLに script タグを追加してください。");
      }

      const params = getSearchParams();

      if (!params.date || !params.grade) {
        alert("日付・学年を選択してください。");
        return;
      }

      const selectedDate = new Date(params.date);
      if (Number.isNaN(selectedDate.getTime())) {
        alert("日付が不正です。");
        return;
      }

      const fiscalYear = getFiscalYear(selectedDate);

      const exportData = USE_DUMMY_DATA
        ? getDummyFiscalYearExportData(params, fiscalYear)
        : await fetchFiscalYearExportData(params, fiscalYear);

      const months = Array.isArray(exportData.months) ? exportData.months : [];
      if (months.length === 0) {
        alert("出力対象データがありません。");
        return;
      }

      const holidayMap = await fetchHolidayMap();

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ChatGPT";
      workbook.created = new Date();

      for (const monthData of months) {
        const students = Array.isArray(monthData.students) ? monthData.students : [];
        if (students.length === 0) {
          continue;
        }

        buildStyledMonthlyWorksheetDynamic(workbook, {
          fiscalYear: exportData.fiscalYear,
          grade: exportData.grade,
          year: monthData.year,
          month: monthData.month,
          dates: monthData.dates,
          students: monthData.students,
          holidayMap,
        });
      }

      if (workbook.worksheets.length === 0) {
        alert("出力対象データがありません。");
        return;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `全体出欠状況_${exportData.fiscalYear}年度_${exportData.grade}年.xlsx`;
      saveAs(new Blob([buffer]), fileName);
    } catch (error) {
      console.error(error);
      alert(error.message || "Excel出力に失敗しました。");
    }
  }

  function getFiscalYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return month >= 4 ? year : year - 1;
  }

  async function fetchFiscalYearExportData(params, fiscalYear) {
    const query = new URLSearchParams({
      fiscal_year: String(fiscalYear),
      grade: String(params.grade),
    });

    const response = await fetch(`${API.fiscalYearExport}?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || `年度帳票データ取得失敗: ${response.status}`;
      const detail = data?.error ? ` / ${data.error}` : "";
      throw new Error(message + detail);
    }

    if (!data || !data.success) {
      throw new Error(data?.message || "年度帳票APIエラー");
    }

    return data;
  }

  async function fetchHolidayMap() {
    try {
      const response = await fetch("https://holidays-jp.github.io/api/v1/date.json", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`祝日取得失敗: ${response.status}`);
      }

      const data = await response.json();
      return data || {};
    } catch (error) {
      console.warn("祝日データ取得に失敗:", error);
      return {};
    }
  }

  function buildStyledMonthlyWorksheetDynamic(workbook, data) {
    const fixedHeaders = ["学籍番号", "氏名", "年次", "コース", "欠数", "公欠数"];
    const dates = Array.isArray(data.dates) ? data.dates : [];
    const students = Array.isArray(data.students) ? data.students : [];
    const holidayMap = data.holidayMap || {};

    const sheetName = `${data.year}-${String(data.month).padStart(2, "0")}`;
    const ws = workbook.addWorksheet(sheetName);

    const ROW_TITLE = 1;
    const ROW_INFO = 2;
    const ROW_BLANK = 3;
    const ROW_DATE = 4;
    const ROW_WEEKDAY = 5;
    const ROW_PERIOD = 6;
    const ROW_SUBJECT = 7;
    const ROW_DATA_START = 8;

    const FIXED_COL_COUNT = fixedHeaders.length;
    const dateColumnPlan = buildDateColumnPlan(students, dates);
    const dynamicColCount = dates.reduce((sum, d) => sum + (dateColumnPlan[d.date]?.length || 1), 0);
    const totalCols = FIXED_COL_COUNT + dynamicColCount;

    ws.views = [{ state: "frozen", xSplit: FIXED_COL_COUNT, ySplit: ROW_DATA_START - 1 }];

    const columns = [
      { width: 12 },
      { width: 14 },
      { width: 8 },
      { width: 14 },
      { width: 8 },
      { width: 8 },
    ];

    dates.forEach((d) => {
      const colDefs = dateColumnPlan[d.date] || [{ key: "__empty__", time: "", subject: "" }];
      colDefs.forEach(() => {
        columns.push({ width: 12 });
      });
    });

    ws.columns = columns;

    const titleCell = ws.getCell(ROW_TITLE, 1);
    titleCell.value = `${data.fiscalYear}年度 ${data.year}年${data.month}月 出欠一覧`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws.getRow(ROW_TITLE).height = 26;

    const infoCell = ws.getCell(ROW_INFO, 1);
    infoCell.value = `学年: ${data.grade}年`;
    infoCell.font = { bold: true };

    fixedHeaders.forEach((header, index) => {
      const col = index + 1;
      ws.mergeCells(ROW_DATE, col, ROW_SUBJECT, col);

      const cell = ws.getCell(ROW_DATE, col);
      cell.value = header;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9EAD3" }
      };
    });

    let currentCol = FIXED_COL_COUNT + 1;

    dates.forEach((d) => {
      const colDefs = dateColumnPlan[d.date] || [{ key: "__empty__", time: "", subject: "" }];
      const span = colDefs.length;
      const startCol = currentCol;
      const endCol = currentCol + span - 1;

      const dayType = getDayType(d.date, holidayMap);
      const fill = getDayFill(dayType);

      ws.mergeCells(ROW_DATE, startCol, ROW_DATE, endCol);
      const dateCell = ws.getCell(ROW_DATE, startCol);
      dateCell.value = formatDateLabel(d.date);
      dateCell.font = { bold: true };
      dateCell.alignment = { horizontal: "center", vertical: "middle" };

      ws.mergeCells(ROW_WEEKDAY, startCol, ROW_WEEKDAY, endCol);
      const weekdayCell = ws.getCell(ROW_WEEKDAY, startCol);
      weekdayCell.value = buildWeekdayLabel(d.date, d.weekday, holidayMap);
      weekdayCell.font = { bold: true };
      weekdayCell.alignment = { horizontal: "center", vertical: "middle" };

      for (let i = 0; i < colDefs.length; i++) {
        const col = startCol + i;
        const colDef = colDefs[i];

        const periodCell = ws.getCell(ROW_PERIOD, col);
        periodCell.value = colDef.time ? `${colDef.time}限` : "";
        periodCell.font = { bold: true };
        periodCell.alignment = { horizontal: "center", vertical: "middle" };

        const subjectCell = ws.getCell(ROW_SUBJECT, col);
        subjectCell.value = colDef.subject || "";
        subjectCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        subjectCell.font = { size: 9 };
      }

      if (fill) {
        for (let row = ROW_DATE; row <= ROW_SUBJECT; row++) {
          for (let col = startCol; col <= endCol; col++) {
            ws.getCell(row, col).fill = fill;
          }
        }
      }

      currentCol += span;
    });

    students.forEach((student, index) => {
      const rowNo = ROW_DATA_START + index;

      const fixedValues = [
        student.studentId ?? "",
        student.studentName ?? "",
        student.gradeLabel ?? data.grade ?? "",
        student.courseName ?? "",
        student.absentCount ?? 0,
        student.officialAbsentCount ?? 0,
      ];

      fixedValues.forEach((value, i) => {
        const cell = ws.getCell(rowNo, i + 1);
        cell.value = value;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      let col = FIXED_COL_COUNT + 1;

      dates.forEach((d) => {
        const colDefs = dateColumnPlan[d.date] || [{ key: "__empty__", time: "", subject: "" }];
        const list = Array.isArray(student.attendance?.[d.date]) ? student.attendance[d.date] : [];
        const entryMap = buildAttendanceEntryMap(list);

        const dayType = getDayType(d.date, holidayMap);
        const fill = getDayFill(dayType);

        colDefs.forEach((colDef) => {
          const hit = entryMap.get(colDef.key);
          const cell = ws.getCell(rowNo, col);
          cell.value = hit?.status ?? "";
          cell.alignment = { horizontal: "center", vertical: "middle" };

          if (fill) {
            cell.fill = fill;
          }

          col++;
        });
      });
    });

    const lastRow = ws.rowCount;

    for (let r = ROW_DATE; r <= lastRow; r++) {
      for (let c = 1; c <= totalCols; c++) {
        ws.getCell(r, c).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    }

    ws.getRow(ROW_TITLE).height = 24;
    ws.getRow(ROW_DATE).height = 22;
    ws.getRow(ROW_WEEKDAY).height = 20;
    ws.getRow(ROW_PERIOD).height = 20;
    ws.getRow(ROW_SUBJECT).height = 36;

    for (let r = ROW_DATA_START; r <= lastRow; r++) {
      ws.getRow(r).height = 22;
    }
  }

  function buildDateColumnPlan(students, dates) {
    const plan = {};

    dates.forEach((d) => {
      const map = new Map();

      students.forEach((student) => {
        const list = Array.isArray(student.attendance?.[d.date]) ? student.attendance[d.date] : [];

        list.forEach((item) => {
          const time = normalizeTime(item.time);
          const subject = normalizeSubject(item.subject);
          const key = buildAttendanceKey(time, subject);

          if (!map.has(key)) {
            map.set(key, {
              key,
              time,
              subject,
            });
          }
        });
      });

      const colDefs = Array.from(map.values()).sort((a, b) => {
        if (a.time !== b.time) {
          return a.time - b.time;
        }
        return String(a.subject).localeCompare(String(b.subject), "ja");
      });

      plan[d.date] = colDefs.length > 0
        ? colDefs
        : [{ key: "__empty__", time: "", subject: "" }];
    });

    return plan;
  }

  function buildAttendanceEntryMap(list) {
    const map = new Map();

    list.forEach((item) => {
      const time = normalizeTime(item.time);
      const subject = normalizeSubject(item.subject);
      const key = buildAttendanceKey(time, subject);

      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return map;
  }

  function buildAttendanceKey(time, subject) {
    return `${time}__${subject}`;
  }

  function normalizeTime(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function normalizeSubject(value) {
    return String(value ?? "").trim();
  }

  function formatDateLabel(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }

  function buildWeekdayLabel(dateStr, fallbackWeekday, holidayMap) {
    const holidayName = holidayMap?.[dateStr];
    if (holidayName) {
      return `${fallbackWeekday || ""}・祝`;
    }
    return fallbackWeekday || "";
  }

  function getDayType(dateStr, holidayMap) {
    if (holidayMap && holidayMap[dateStr]) {
      return "holiday";
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return "weekday";
    }

    const day = date.getDay();

    if (day === 0) return "sunday";
    if (day === 6) return "saturday";
    return "weekday";
  }

  function getDayFill(type) {
    switch (type) {
      case "holiday":
        return {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5CC" }
        };
      case "sunday":
        return {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FCE4D6" }
        };
      case "saturday":
        return {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9EAF7" }
        };
      default:
        return null;
    }
  }

  function sanitizeFileName(value) {
    return String(value).replace(/[\\/:*?"<>|]/g, "_");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getDummyAttendanceData(params) {
    const allStudents = [
      {
        studentId: "000001",
        studentName: "山田太郎",
        grade: "1",
        classId: "1",
        attendance: {
          "1": { subject: "ネットワーク基礎", status: "○" },
          "2": { subject: "アルゴリズム", status: "○" },
          "3": { subject: "Linux", status: "遅" },
          "4": { subject: "セキュリティ", status: "○" },
        },
      },
      {
        studentId: "000002",
        studentName: "佐藤花子",
        grade: "1",
        classId: "1",
        attendance: {
          "1": { subject: "ネットワーク基礎", status: "欠" },
          "2": { subject: "アルゴリズム", status: "○" },
          "3": { subject: "Linux", status: "○" },
          "4": { subject: "セキュリティ", status: "公" },
        },
      },
      {
        studentId: "000003",
        studentName: "田中一郎",
        grade: "1",
        classId: "3",
        attendance: {
          "1": { subject: "簿記", status: "○" },
          "2": { subject: "Excel実習", status: "○" },
          "3": { subject: "販売実務", status: "早" },
          "4": { subject: "ビジネス文書", status: "○" },
        },
      },
      {
        studentId: "000004",
        studentName: "高橋美咲",
        grade: "2",
        classId: "2",
        attendance: {
          "1": { subject: "医療事務", status: "○" },
          "2": { subject: "調剤報酬", status: "遅" },
          "3": { subject: "レセプト演習", status: "○" },
          "4": { subject: "就職指導", status: "○" },
        },
      },
    ];

    const filtered = allStudents.filter((student) => {
      return String(student.grade) === String(params.grade)
        && String(student.classId) === String(params.classId);
    });

    return {
      success: true,
      date: params.date,
      grade: Number(params.grade),
      classId: Number(params.classId),
      className: params.className ?? "",
      periods: [1, 2, 3, 4],
      students: filtered,
    };
  }

  function getDummyFiscalYearExportData(params, fiscalYear) {
    const months = [];

    for (let i = 0; i < 12; i++) {
      const baseMonth = 4 + i;
      const year = baseMonth <= 12 ? fiscalYear : fiscalYear + 1;
      const month = baseMonth <= 12 ? baseMonth : baseMonth - 12;
      const ym = `${year}-${String(month).padStart(2, "0")}`;

      months.push({
        year,
        month,
        dates: [
          { date: `${ym}-01`, weekday: "月" },
          { date: `${ym}-02`, weekday: "火" },
          { date: `${ym}-03`, weekday: "水" },
        ],
        students: [
          {
            studentId: "100001",
            studentName: "学生A",
            gradeLabel: String(params.grade),
            courseName: "情報システム科",
            absentCount: 2,
            officialAbsentCount: 1,
            attendance: {
              [`${ym}-01`]: [
                { time: 1, subject: "ネットワーク", status: "○" },
                { time: 2, subject: "データベース", status: "×" },
                { time: 3, subject: "Java", status: "○" },
              ],
              [`${ym}-02`]: [
                { time: 1, subject: "Linux", status: "公" },
                { time: 2, subject: "Java", status: "○" },
                { time: 3, subject: "演習", status: "遅" },
                { time: 4, subject: "演習", status: "○" },
              ],
            },
          },
          {
            studentId: "100021",
            studentName: "学生B",
            gradeLabel: String(params.grade),
            courseName: "AIシステム科",
            absentCount: 1,
            officialAbsentCount: 0,
            attendance: {
              [`${ym}-01`]: [
                { time: 1, subject: "Python", status: "○" },
                { time: 2, subject: "機械学習", status: "○" },
                { time: 3, subject: "演習", status: "早" },
                { time: 4, subject: "演習", status: "○" },
                { time: 5, subject: "課題研究", status: "○" },
              ],
              [`${ym}-02`]: [
                { time: 1, subject: "Python", status: "○" },
                { time: 2, subject: "機械学習", status: "×" },
              ],
            },
          },
        ],
      });
    }

    return {
      success: true,
      fiscalYear,
      grade: Number(params.grade),
      months,
    };
  }
});