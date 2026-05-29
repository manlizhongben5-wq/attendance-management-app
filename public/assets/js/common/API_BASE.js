const API_BASE = '/attendance-management-app/backend/php';

const API = {
  // マスタ系
  classes: `${API_BASE}/get_classes.php`,
  lessons: `${API_BASE}/get_lessons.php`,
  students: `${API_BASE}/get_students.php`,

  // 出欠系
  summary: `${API_BASE}/get_attendance_summary.php`,
  attendances: `${API_BASE}/get_attendances.php`,
  saveAttendances: `${API_BASE}/save_attendances.php`,
};