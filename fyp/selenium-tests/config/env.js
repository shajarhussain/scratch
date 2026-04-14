module.exports = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:5000/api',
  credentials: {
    student_nogroup: { email: 'selenium_nogroup@test.com', password: 'password123' },
    student_ingroup: { email: 'selenium_ingroup@test.com', password: 'password123' },
    supervisor_free: { email: 'selenium_supfree@test.com', password: 'password123' },
    supervisor_paired: { email: 'selenium_suppaired@test.com', password: 'password123' },
    coordinator: { email: 'selenium_coord@test.com', password: 'password123' }
  },
  timeouts: {
    implicit: 5000,
    pageLoad: 10000,
    explicit: 5000
  }
};
