/**
 * ECS Mentoring Portal - API client (vanilla JS).
 * Backend: Express + MongoDB (localhost or Render)
 */
(function (global) {
  function getApiBase() {
    if (typeof window !== 'undefined' && window.ECS_API_BASE) {
      return window.ECS_API_BASE;
    }
    var host = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    return (window.location ? window.location.protocol + '//' + host + ':3000/api' : 'http://localhost:3000/api');
  }
  var API_BASE = getApiBase();
  var TOKEN_KEY = 'ecs_token';
  var USER_KEY = 'ecs_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getAuthHeaders() {
    var token = getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? 'Bearer ' + token : ''
    };
  }

  function setAuth(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    try {
      var u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function request(method, path, body) {
    var base = getApiBase();
    var url = path.indexOf('http') === 0 ? path : base + path;
    var isLoginRequest = (method === 'POST' && path === '/login');
    var options = { method: method, headers: getAuthHeaders() };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return fetch(url, options).then(function (res) {
      return res.text().then(function (text) {
        var data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (_) {}
        if (res.status === 401) {
          if (!isLoginRequest) {
            clearAuth();
            if (typeof window !== 'undefined' && window.location.pathname.indexOf('login') === -1) {
              window.location.href = 'login.html';
            }
            return Promise.reject(new Error('Session expired'));
          }
          return Promise.reject(new Error(data.message || 'Invalid email or password'));
        }
        if (!res.ok) {
          var msg = data.message || ('Request failed (' + res.status + ')');
          return Promise.reject(new Error(msg));
        }
        return data;
      });
    }).catch(function (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        return Promise.reject(new Error('Cannot reach server. Check your connection and try again.'));
      }
      return Promise.reject(err);
    });
  }

  global.ECS_API = {
    getToken: getToken,
    getAuthHeaders: getAuthHeaders,
    setAuth: setAuth,
    clearAuth: clearAuth,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    get: function (path) { return request('GET', path); },
    post: function (path, body) { return request('POST', path, body); },
    put: function (path, body) { return request('PUT', path, body); },
    patch: function (path, body) { return request('PATCH', path, body); },
    delete: function (path) { return request('DELETE', path); },
    auth: {
      login: function (email, password) { return request('POST', '/login', { email: email, password: password }); },
      me: function () { return request('GET', '/auth/me'); },
      updateMe: function (body) { return request('PATCH', '/auth/me', body); }
    },
    student: {
      dashboard: function () { return request('GET', '/student/dashboard'); },
      liveSessions: function () { return request('GET', '/student/live-sessions'); },
      sessionsUpcoming: function () { return request('GET', '/student/sessions/upcoming'); },
      meetLink: function (sessionId) { return request('GET', '/student/sessions/' + sessionId + '/meet-link'); },
      mentor: function (email) {
        var path = '/student/mentor';
        if (email) path += '?email=' + encodeURIComponent(email);
        return request('GET', path);
      },
      attendance: function () { return request('GET', '/student/attendance'); },
      announcements: function () { return request('GET', '/student/announcements'); },
      notifications: function () { return request('GET', '/notifications'); }
    },
    teacher: {
      sessions: function () { return request('GET', '/teacher/sessions'); },
      createSession: function (body) { return request('POST', '/teacher/sessions', body); },
      updateMeetLink: function (sessionId, body) { return request('PUT', '/teacher/session/' + sessionId + '/meet-link', body); },
      updateSession: function (sessionId, body) { return request('PUT', '/teacher/sessions/' + sessionId, body); }
    },
    notifications: {
      list: function () { return request('GET', '/notifications'); },
      markRead: function (id) { return request('PATCH', '/notifications/' + id + '/read'); },
      markAllRead: function () { return request('PATCH', '/notifications/read-all'); }
    },
    admin: {
      students: function (query) {
        var q = query || {};
        var params = new URLSearchParams();
        if (q.department) params.set('department', q.department);
        if (q.year) params.set('year', q.year);
        if (q.limit) params.set('limit', q.limit);
        var path = '/admin/students';
        if (params.toString()) path += '?' + params.toString();
        return request('GET', path);
      },
      teachers: function (query) {
        var q = query || {};
        var params = new URLSearchParams();
        if (q.department) params.set('department', q.department);
        if (q.limit) params.set('limit', q.limit);
        var path = '/admin/teachers';
        if (params.toString()) path += '?' + params.toString();
        return request('GET', path);
      },
      assignMentor: function (studentId, mentorId) {
        return request('POST', '/admin/assign-mentor', { studentId: studentId, mentorId: mentorId });
      }
    },
    chat: {
      contacts: function () { return request('GET', '/chat/contacts'); },
      conversations: function () { return request('GET', '/chat/conversations'); },
      getOrCreateConversation: function (otherUserId) { return request('POST', '/chat/conversations', { otherUserId: otherUserId }); },
      getConversation: function (conversationId, query) {
        var q = query || {};
        var params = new URLSearchParams();
        if (q.limit) params.set('limit', q.limit);
        if (q.before) params.set('before', q.before);
        var path = '/chat/conversations/' + conversationId;
        if (params.toString()) path += '?' + params.toString();
        return request('GET', path);
      },
      sendMessage: function (conversationId, content) { return request('POST', '/chat/conversations/' + conversationId + '/messages', { content: content }); },
      markMessageRead: function (messageId) { return request('PATCH', '/chat/messages/' + messageId + '/read'); }
    }
  };
})(typeof window !== 'undefined' ? window : this);
