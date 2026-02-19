(function () {
  'use strict';

  // ----- Auth check: redirect to login if no token -----
  if (typeof ECS_API !== 'undefined' && !ECS_API.isLoggedIn()) {
    window.location.href = 'login.html';
    throw new Error('Redirecting to login');
  }

  var user = typeof ECS_API !== 'undefined' ? ECS_API.getUser() : null;
  var navUserName = document.getElementById('nav-user-name');
  var navUserHandle = document.getElementById('nav-user-handle');
  var navAvatar = document.getElementById('nav-avatar');
  var AVATAR_MALE = 'https://api.dicebear.com/7.x/lorelei/svg?seed=male';
  var AVATAR_FEMALE = 'https://api.dicebear.com/7.x/lorelei/svg?seed=female';
  if (navUserName && user && user.name) navUserName.textContent = user.name;
  if (navUserHandle && user) {
    var handle = (user.email && user.email.split('@')[0]) ? '@' + user.email.split('@')[0].replace(/\./g, '_') : ('@' + (user.role || 'user'));
    navUserHandle.textContent = handle;
  }
  if (navAvatar && user) {
    navAvatar.src = user.gender === 'female' ? AVATAR_FEMALE : AVATAR_MALE;
    navAvatar.alt = user.name ? user.name + ' profile' : 'Profile';
  }

  // ----- Logout -----
  var btnLogout = document.getElementById('btn-logout');
  if (btnLogout && typeof ECS_API !== 'undefined') {
    btnLogout.addEventListener('click', function (e) {
      e.preventDefault();
      ECS_API.clearAuth();
      window.location.href = 'login.html';
    });
  }

  // ----- Sidebar: switch content panel -----
  var navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-page]');
  var contentPanels = document.querySelectorAll('.content-panel[data-page]');
  var navAdminMentors = document.getElementById('nav-admin-mentors');
  if (user && user.role === 'admin' && navAdminMentors) navAdminMentors.style.display = 'flex';

  function showPanel(pageId) {
    contentPanels.forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-page') === pageId);
    });
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });
    if (navAdminMentors) navAdminMentors.classList.toggle('active', pageId === 'admin-mentors');
    if (pageId === 'sessions') loadSessionsPanel();
    if (pageId === 'mentors') loadMentorsPanel();
    if (pageId === 'progress') loadProgressPanel();
    if (pageId === 'chat') loadChatPanel();
    if (pageId === 'admin-mentors') loadAdminMentorsPanel();
    if (pageId === 'settings') initSettingsPanel();
  }

  function updateProfilePictureFromUser(u) {
    var img = document.getElementById('nav-avatar');
    if (!img) return;
    img.src = (u && u.gender === 'female') ? AVATAR_FEMALE : AVATAR_MALE;
    img.alt = (u && u.name) ? u.name + ' profile' : 'Profile';
  }

  function initSettingsPanel() {
    var pref = document.getElementById('profile-picture-pref');
    if (!pref || !user) return;
    pref.value = user.gender === 'female' ? 'female' : 'male';
    pref.onchange = function () {
      var gender = pref.value;
      if (typeof ECS_API === 'undefined') return;
      ECS_API.auth.updateMe({ gender: gender }).then(function (data) {
        if (data.user) {
          ECS_API.setAuth(ECS_API.getToken(), data.user);
          user = data.user;
          updateProfilePictureFromUser(user);
        }
      }).catch(function () {});
    };
  }
  function setActive(el) {
    var page = el ? el.getAttribute('data-page') : 'mentoring';
    showPanel(page);
  }
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      setActive(item);
    });
  });

  // ----- SEM-IV actual courses (from timetable) -----
  var SEM_IV_COURSES = [
    { code: '25BSC12EC05', vertical: 'BSESC', subVertical: 'BSC', name: 'Mathematics and Numerical Methods', credits: 3, creditsNote: '' },
    { code: '25PCC12EC09', vertical: 'PCPEC', subVertical: 'PCC', name: 'Analog Electronic Circuits', credits: 3, creditsNote: '' },
    { code: '25PCC12EC10', vertical: 'PCPEC', subVertical: 'PCC', name: 'Discrete Structures and Automata Theory', credits: 3, creditsNote: '' },
    { code: '25PCC12EC11', vertical: 'PCPEC', subVertical: 'PCC', name: 'Web Technologies Lab', credits: 1, creditsNote: '' },
    { code: '25OE2X', vertical: 'MDC', subVertical: 'OE', name: 'Emerging Technology and Law / Principles of Management', credits: 2, creditsNote: '' },
    { code: '25MDMXX3', vertical: 'MDC', subVertical: 'MDM', name: 'MDM Course-3', credits: 2, creditsNote: '' },
    { code: '25VSE12EC03', vertical: 'SC', subVertical: 'VSEC', name: 'Data Structures', credits: 4, creditsNote: '' },
    { code: '25EEM12EC02', vertical: 'HSSM', subVertical: 'EEMC', name: 'Technology Entrepreneurship', credits: 2, creditsNote: '' },
    { code: '25VEC12ECO2', vertical: 'HSSM', subVertical: 'VEC', name: 'Technology Innovation for Sustainable Development', credits: 2, creditsNote: '' },
    { code: '25DMX2', vertical: 'DM', subVertical: 'DM', name: 'Double Minor Course', credits: 4, creditsNote: '#' },
    { code: '25HR03', vertical: 'HR', subVertical: 'HR', name: 'Honors with Research', credits: 4, creditsNote: '*' },
    { code: '25BC', vertical: 'BC', subVertical: 'BC', name: 'MOOC', credits: 25, creditsNote: '$' }
  ];

  var CARD_VARIANTS = ['design', 'business', 'programming'];

  function renderSemIVCourses(filterVertical) {
    var container = document.getElementById('cards-row');
    if (!container) return;
    var list = filterVertical
      ? SEM_IV_COURSES.filter(function (c) { return c.vertical === filterVertical; })
      : SEM_IV_COURSES.slice();
    container.innerHTML = list.map(function (course, i) {
      var variant = CARD_VARIANTS[i % CARD_VARIANTS.length];
      var creditsDisplay = course.credits + (course.creditsNote || '') + ' credits';
      var seed = (course.code || i).replace(/\D/g, '') || i;
      return '<article class="mentor-card mentor-card--' + variant + '" data-course-code="' + (course.code || '').replace(/"/g, '&quot;') + '">' +
        '<button type="button" class="card-bookmark" aria-label="Bookmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>' +
        '<span class="card-tag">' + (course.vertical || '').replace(/</g, '&lt;') + '</span>' +
        '<h2 class="card-title">' + (course.name || course.code || 'Course').replace(/</g, '&lt;') + '</h2>' +
        '<div class="card-progress">' +
          '<div class="progress-bar" style="--progress: 0%"></div>' +
          '<span class="progress-text">' + creditsDisplay.replace(/</g, '&lt;') + '</span>' +
        '</div>' +
        '<div class="card-avatars">' +
          '<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=' + seed + '1" alt="" width="32" height="32">' +
          '<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=' + seed + '2" alt="" width="32" height="32">' +
          '<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=' + seed + '3" alt="" width="32" height="32">' +
          '<span class="card-avatars-count">+0</span>' +
        '</div>' +
        '<button type="button" class="btn-continue btn-continue--lime" data-session-id="">Continue</button>' +
      '</article>';
    }).join('');
    setTimeout(applyBookmarks, 0);
  }

  // Filter pills: filter courses by vertical
  var filterPills = document.getElementById('filter-pills');
  if (filterPills) {
    filterPills.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      filterPills.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('pill--active'); });
      pill.classList.add('pill--active');
      var filter = pill.getAttribute('data-filter') || '';
      renderSemIVCourses(filter || undefined);
    });
  }

  // ----- Load student dashboard (sessions table only); courses are SEM-IV -----
  function mentorName(session) {
    if (!session || !session.teacher) return '—';
    var t = session.teacher;
    if (t.user && t.user.name) return t.user.name;
    if (t.department) return t.department;
    return 'Mentor';
  }

  function renderSessionsTable(sessions) {
    var tbody = document.getElementById('sessions-tbody');
    if (!tbody) return;
    if (!sessions || sessions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No upcoming sessions.</td></tr>';
      return;
    }
    tbody.innerHTML = sessions.map(function (s) {
      var joinCell = (s.meetLink && s.meetLink.trim())
        ? '<a href="#" class="join-meet-link" data-meet-link="' + (s.meetLink || '').replace(/"/g, '&quot;') + '">Join meeting</a>'
        : '—';
      return '<tr><td>' + (s.title || '—') + '</td><td>' + mentorName(s) + '</td><td>' + (s.duration ? s.duration + ' min' : '—') + '</td><td>' + joinCell + '</td></tr>';
    }).join('');
    tbody.querySelectorAll('.join-meet-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var link = a.getAttribute('data-meet-link');
        if (link) window.open(link, '_blank');
      });
    });
  }

  function loadDashboard() {
    renderSemIVCourses();
    if (typeof ECS_API === 'undefined') return;
    if (user && user.role !== 'student') {
      renderSessionsTable([]);
      var tbody = document.getElementById('sessions-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-muted">This dashboard is for students. You are logged in as ' + (user.role || 'user') + '.</td></tr>';
      return;
    }
    ECS_API.student.dashboard()
      .then(function (data) {
        var sessions = data.upcomingSessions || data.sessions || [];
        renderSessionsTable(sessions);
      })
      .catch(function () {
        renderSessionsTable([]);
        var tbody = document.getElementById('sessions-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Could not load sessions. Check backend and login as student.</td></tr>';
      });
  }

  function loadSessionsPanel() {
    var tbody = document.getElementById('sessions-tbody-full');
    if (!tbody || typeof ECS_API === 'undefined' || !user || user.role !== 'student') return;
    ECS_API.student.sessionsUpcoming()
      .then(function (data) {
        var sessions = data.sessions || [];
        if (!sessions.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No upcoming sessions.</td></tr>';
          return;
        }
        tbody.innerHTML = sessions.map(function (s) {
          var dateStr = s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : '—';
          var joinCell = (s.meetLink && s.meetLink.trim())
            ? '<a href="#" class="join-meet-link" data-meet-link="' + (s.meetLink || '').replace(/"/g, '&quot;') + '">Join meeting</a>'
            : '—';
          return '<tr><td>' + (s.title || '—') + '</td><td>' + mentorName(s) + '</td><td>' + (s.duration ? s.duration + ' min' : '—') + '</td><td>' + dateStr + '</td><td>' + joinCell + '</td></tr>';
        }).join('');
        tbody.querySelectorAll('.join-meet-link').forEach(function (a) {
          a.addEventListener('click', function (e) { e.preventDefault(); var link = a.getAttribute('data-meet-link'); if (link) window.open(link, '_blank'); });
        });
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Could not load sessions.</td></tr>';
      });
  }

  function loadMentorsPanel() {
    var card = document.getElementById('mentor-info-card');
    if (!card || typeof ECS_API === 'undefined' || !user || user.role !== 'student') return;
    ECS_API.student.mentor()
      .then(function (data) {
        var m = data.mentor;
        if (!m || !m.user) {
          card.innerHTML = '<p class="text-muted">No mentor assigned yet.</p>';
          return;
        }
        var name = (m.user.name || 'Mentor').replace(/</g, '&lt;');
        var email = (m.user.email || '').replace(/</g, '&lt;');
        var dept = (m.department || '').replace(/</g, '&lt;');
        card.innerHTML = '<p><strong>' + name + '</strong></p><p>Email: ' + email + '</p><p>Department: ' + dept + '</p>';
      })
      .catch(function () {
        card.innerHTML = '<p class="text-muted">No mentor assigned or could not load.</p>';
      });
  }

  function loadProgressPanel() {
    var el = document.getElementById('progress-content');
    if (!el || typeof ECS_API === 'undefined' || !user || user.role !== 'student') return;
    ECS_API.student.attendance()
      .then(function (data) {
        var records = data.attendance || data.records || [];
        if (!records.length) {
          el.innerHTML = '<p class="text-muted">No attendance records yet.</p>';
          return;
        }
        var html = '<table class="sessions-table"><thead><tr><th>Session</th><th>Status</th><th>Date</th></tr></thead><tbody>';
        records.slice(0, 20).forEach(function (r) {
          var title = (r.session && r.session.title) ? r.session.title : '—';
          var status = (r.status || '—').replace(/</g, '&lt;');
          var date = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—';
          html += '<tr><td>' + title + '</td><td>' + status + '</td><td>' + date + '</td></tr>';
        });
        html += '</tbody></table>';
        el.innerHTML = html;
      })
      .catch(function () {
        el.innerHTML = '<p class="text-muted">No attendance data or could not load.</p>';
      });
  }

  // ----- Chat panel -----
  var chatConversationsList = document.getElementById('chat-conversations-list');
  var chatContactsDropdown = document.getElementById('chat-contacts-dropdown');
  var chatContactsList = document.getElementById('chat-contacts-list');
  var chatNewBtn = document.getElementById('chat-new-btn');
  var chatEmpty = document.getElementById('chat-empty');
  var chatThread = document.getElementById('chat-thread');
  var chatThreadHeader = document.getElementById('chat-thread-header');
  var chatMessages = document.getElementById('chat-messages');
  var chatSendForm = document.getElementById('chat-send-form');
  var chatInput = document.getElementById('chat-input');
  var currentChatConversationId = null;
  var chatContacts = [];
  var chatConversations = [];

  function loadChatPanel() {
    if (typeof ECS_API === 'undefined') return;
    if (chatConversationsList) chatConversationsList.innerHTML = '<p class="text-muted chat-placeholder">Loading...</p>';
    Promise.all([ECS_API.chat.contacts(), ECS_API.chat.conversations()])
      .then(function (results) {
        chatContacts = (results[0].contacts || []);
        chatConversations = (results[1].conversations || []);
        renderChatConversationsList();
        if (chatContactsDropdown) chatContactsDropdown.style.display = 'none';
      })
      .catch(function () {
        if (chatConversationsList) chatConversationsList.innerHTML = '<p class="text-muted chat-placeholder">Could not load. Check you are logged in.</p>';
      });
  }

  function renderChatConversationsList() {
    if (!chatConversationsList) return;
    if (!chatConversations.length) {
      chatConversationsList.innerHTML = '<p class="text-muted chat-placeholder">No conversations yet. Click &quot;New chat&quot; to start.</p>';
      return;
    }
    chatConversationsList.innerHTML = chatConversations.map(function (c) {
      var id = (c._id && c._id.toString()) || '';
      var name = (c.other && c.other.name) ? c.other.name.replace(/</g, '&lt;') : 'Unknown';
      var preview = (c.lastMessage && c.lastMessage.content) ? c.lastMessage.content.replace(/</g, '&lt;') : '';
      var active = currentChatConversationId === id ? ' active' : '';
      return '<div class="chat-conv-item' + active + '" data-conv-id="' + id.replace(/"/g, '&quot;') + '"><div><span class="conv-name">' + name + '</span><span class="conv-preview">' + preview + '</span></div></div>';
    }).join('');
    chatConversationsList.querySelectorAll('.chat-conv-item').forEach(function (el) {
      el.addEventListener('click', function () {
        openChatConversation(el.getAttribute('data-conv-id'));
      });
    });
  }

  function openChatConversation(convId) {
    if (!convId || typeof ECS_API === 'undefined') return;
    currentChatConversationId = convId;
    renderChatConversationsList();
    if (chatEmpty) chatEmpty.style.display = 'none';
    if (chatThread) chatThread.style.display = 'flex';
    var conv = chatConversations.find(function (c) { return (c._id && c._id.toString()) === convId; });
    if (chatThreadHeader && conv && conv.other) chatThreadHeader.textContent = conv.other.name + (conv.other.role ? ' (' + conv.other.role + ')' : '');
    if (chatMessages) chatMessages.innerHTML = '<p class="text-muted">Loading messages...</p>';
    ECS_API.chat.getConversation(convId)
      .then(function (data) {
        if (chatMessages) {
          var msgs = data.messages || [];
          if (!msgs.length) {
            chatMessages.innerHTML = '<p class="text-muted">No messages yet. Say hello!</p>';
          } else {
            chatMessages.innerHTML = msgs.map(function (m) {
              var isSent = (m.sender && m.sender._id && m.sender._id.toString()) === (user && user._id && user._id.toString());
              var cls = isSent ? 'chat-msg sent' : 'chat-msg received';
              var name = (m.sender && m.sender.name) ? m.sender.name.replace(/</g, '&lt;') : '';
              var content = (m.content || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
              var time = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
              return '<div class="' + cls + '"><div>' + content + '</div><span class="msg-meta">' + name + ' · ' + time + '</span></div>';
            }).join('');
          }
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
      })
      .catch(function () {
        if (chatMessages) chatMessages.innerHTML = '<p class="text-muted">Could not load messages.</p>';
      });
  }

  function startNewChatWith(otherUserId) {
    if (!otherUserId || typeof ECS_API === 'undefined') return;
    if (chatContactsDropdown) chatContactsDropdown.style.display = 'none';
    if (chatEmpty) chatEmpty.style.display = 'none';
    if (chatThread) chatThread.style.display = 'flex';
    if (chatMessages) chatMessages.innerHTML = '<p class="text-muted">Starting chat...</p>';
    if (chatThreadHeader) chatThreadHeader.textContent = 'New chat';
    ECS_API.chat.getOrCreateConversation(otherUserId)
      .then(function (data) {
        var conv = data.conversation;
        if (!conv || !conv._id) return;
        var id = conv._id.toString();
        if (!chatConversations.some(function (c) { return (c._id && c._id.toString()) === id; })) {
          chatConversations.unshift({ _id: conv._id, other: conv.other, lastMessage: null, lastMessageAt: null });
        }
        openChatConversation(id);
      })
      .catch(function (err) {
        if (chatMessages) chatMessages.innerHTML = '<p class="text-muted">' + (err.message || 'Could not start chat.') + '</p>';
        if (chatThreadHeader) chatThreadHeader.textContent = 'New chat';
      });
  }

  if (chatNewBtn) {
    chatNewBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (chatContactsDropdown && chatContactsDropdown.style.display === 'block') {
        chatContactsDropdown.style.display = 'none';
        return;
      }
      if (typeof ECS_API === 'undefined') return;
      if (chatContactsList) chatContactsList.innerHTML = '<li class="text-muted">Loading contacts...</li>';
      if (chatContactsDropdown) chatContactsDropdown.style.display = 'block';
      ECS_API.chat.contacts()
        .then(function (data) {
          chatContacts = data.contacts || [];
          showChatContactsDropdown();
        })
        .catch(function () {
          if (chatContactsList) chatContactsList.innerHTML = '<li class="text-muted">Could not load contacts.</li>';
        });
    });
  }
  function showChatContactsDropdown() {
    if (!chatContactsDropdown || !chatContactsList) return;
    if (!chatContacts.length) {
      chatContactsList.innerHTML = '<li class="text-muted">No contacts to chat with.</li>';
    } else {
      var order = { student: 0, parent: 1, teacher: 2, admin: 3 };
      var sorted = chatContacts.slice().sort(function (a, b) {
        var ra = order[a.role] !== undefined ? order[a.role] : 4;
        var rb = order[b.role] !== undefined ? order[b.role] : 4;
        return ra !== rb ? ra - rb : ((a.name || '').localeCompare(b.name || ''));
      });
      var html = '';
      if (user && user.role === 'teacher') {
        var byRole = { student: [], parent: [], admin: [] };
        sorted.forEach(function (c) {
          if (c.role === 'student') byRole.student.push(c);
          else if (c.role === 'parent') byRole.parent.push(c);
          else if (c.role === 'admin') byRole.admin.push(c);
        });
        if (byRole.student.length) {
          html += '<li class="chat-contact-header">Students</li>';
          byRole.student.forEach(function (c) { html += contactItemHtml(c); });
        }
        if (byRole.parent.length) {
          html += '<li class="chat-contact-header">Parents</li>';
          byRole.parent.forEach(function (c) { html += contactItemHtml(c); });
        }
        if (byRole.admin.length) {
          html += '<li class="chat-contact-header">Admin</li>';
          byRole.admin.forEach(function (c) { html += contactItemHtml(c); });
        }
      } else {
        sorted.forEach(function (c) { html += contactItemHtml(c); });
      }
      chatContactsList.innerHTML = html || '<li class="text-muted">No contacts.</li>';
      chatContactsList.querySelectorAll('li[data-user-id]').forEach(function (li) {
        li.addEventListener('click', function (e) {
          e.stopPropagation();
          startNewChatWith(li.getAttribute('data-user-id'));
        });
      });
    }
    chatContactsDropdown.style.display = 'block';
  }
  function contactItemHtml(c) {
    var id = (c._id && c._id.toString()) || '';
    var name = (c.name || '').replace(/</g, '&lt;');
    var role = (c.role || '').replace(/</g, '&lt;');
    return '<li data-user-id="' + id.replace(/"/g, '&quot;') + '"><strong>' + name + '</strong><span> ' + role + '</span></li>';
  }
  document.addEventListener('click', function () {
    if (chatContactsDropdown && chatContactsDropdown.style.display === 'block') {
      chatContactsDropdown.style.display = 'none';
    }
  });
  if (chatContactsDropdown) {
    chatContactsDropdown.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  if (chatSendForm && chatInput) {
    chatSendForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var content = chatInput.value.trim();
      if (!content || !currentChatConversationId || typeof ECS_API === 'undefined') return;
      chatInput.value = '';
      ECS_API.chat.sendMessage(currentChatConversationId, content)
        .then(function (data) {
          if (data.message && chatMessages) {
            var m = data.message;
            var isSent = true;
            var cls = 'chat-msg sent';
            var name = (user && user.name) ? user.name.replace(/</g, '&lt;') : '';
            var text = (m.content || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');
            var time = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
            var wrap = document.createElement('div');
            wrap.className = cls;
            wrap.innerHTML = '<div>' + text + '</div><span class="msg-meta">' + name + ' · ' + time + '</span>';
            chatMessages.appendChild(wrap);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
          var conv = chatConversations.find(function (c) { return (c._id && c._id.toString()) === currentChatConversationId; });
          if (conv) {
            conv.lastMessage = { content: content, createdAt: new Date() };
            conv.lastMessageAt = new Date();
            renderChatConversationsList();
          }
        })
        .catch(function () {});
    });
  }

  var assignStudentsModal = document.getElementById('assign-students-modal');
  var assignStudentsTitle = document.getElementById('assign-students-modal-title');
  var assignStudentsList = document.getElementById('assign-students-list');
  var assignStudentsMessage = document.getElementById('assign-students-message');
  var assignStudentsSubmit = document.getElementById('assign-students-submit');
  var assignStudentsModalClose = document.getElementById('assign-students-modal-close');
  var currentAssignMentorId = null;

  function openAssignStudentsModal(teacherId, teacherName) {
    currentAssignMentorId = teacherId;
    if (assignStudentsTitle) assignStudentsTitle.textContent = 'Assign students to ' + (teacherName || 'this mentor');
    if (assignStudentsList) assignStudentsList.innerHTML = '<p class="text-muted">Loading students...</p>';
    if (assignStudentsMessage) assignStudentsMessage.textContent = '';
    if (assignStudentsModal) {
      assignStudentsModal.classList.add('is-open');
      assignStudentsModal.setAttribute('aria-hidden', 'false');
    }
    if (typeof ECS_API === 'undefined') return;
    ECS_API.admin.students().then(function (data) {
      var students = data.students || [];
      if (!assignStudentsList) return;
      if (!students.length) {
        assignStudentsList.innerHTML = '<p class="text-muted">No students found.</p>';
        return;
      }
      assignStudentsList.innerHTML = '<div class="assign-students-checkboxes">' + students.map(function (s) {
        var id = (s._id && s._id.toString()) || '';
        var name = (s.user && s.user.name) || '';
        var roll = s.rollNo || '';
        var label = (name && roll ? name + ' (' + roll + ')' : (name || roll || 'Student')).replace(/</g, '&lt;');
        return '<label class="assign-student-row"><input type="checkbox" class="assign-student-cb" value="' + id + '"> ' + label + '</label>';
      }).join('') + '</div>';
    }).catch(function () {
      if (assignStudentsList) assignStudentsList.innerHTML = '<p class="text-muted">Could not load students.</p>';
    });
  }

  function closeAssignStudentsModal() {
    currentAssignMentorId = null;
    if (assignStudentsModal) {
      assignStudentsModal.classList.remove('is-open');
      assignStudentsModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (assignStudentsModalClose) assignStudentsModalClose.addEventListener('click', closeAssignStudentsModal);
  if (assignStudentsModal) assignStudentsModal.addEventListener('click', function (e) {
    if (e.target === assignStudentsModal) closeAssignStudentsModal();
  });

  if (assignStudentsSubmit) {
    assignStudentsSubmit.addEventListener('click', function () {
      if (!currentAssignMentorId || typeof ECS_API === 'undefined') return;
      var checkboxes = assignStudentsModal && assignStudentsModal.querySelectorAll('.assign-student-cb:checked');
      if (!checkboxes || !checkboxes.length) {
        if (assignStudentsMessage) { assignStudentsMessage.textContent = 'Select at least one student.'; assignStudentsMessage.style.color = '#dc2626'; }
        return;
      }
      var ids = [];
      for (var i = 0; i < checkboxes.length; i++) ids.push(checkboxes[i].value);
      if (assignStudentsMessage) { assignStudentsMessage.textContent = 'Assigning...'; assignStudentsMessage.style.color = ''; }
      assignStudentsSubmit.disabled = true;
      var done = 0;
      var errMsg = '';
      function next() {
        if (done >= ids.length) {
          assignStudentsSubmit.disabled = false;
          if (errMsg) {
            if (assignStudentsMessage) { assignStudentsMessage.textContent = errMsg; assignStudentsMessage.style.color = '#dc2626'; }
          } else {
            if (assignStudentsMessage) { assignStudentsMessage.textContent = 'Assigned ' + ids.length + ' student(s).'; assignStudentsMessage.style.color = ''; }
            closeAssignStudentsModal();
            if (typeof loadAdminMentorsPanel === 'function') loadAdminMentorsPanel();
          }
          return;
        }
        ECS_API.admin.assignMentor(ids[done], currentAssignMentorId)
          .then(function () { done++; next(); })
          .catch(function (err) { errMsg = err.message || 'Failed for some students.'; done++; next(); });
      }
      next();
    });
  }

  function loadAdminMentorsPanel() {
    if (typeof ECS_API === 'undefined' || user.role !== 'admin') return;
    var tbody = document.getElementById('admin-teachers-tbody');

    function renderTeachersTable(teachers) {
      if (!tbody) return;
      if (!teachers || !teachers.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-muted">No teachers found.</td></tr>';
        return;
      }
      tbody.innerHTML = teachers.map(function (t) {
        var mentorId = (t._id && t._id.toString()) || '';
        var name = ((t.user && t.user.name) || '—').replace(/</g, '&lt;');
        var email = ((t.user && t.user.email) || '—').replace(/</g, '&lt;');
        var dept = (t.department || '—').replace(/</g, '&lt;');
        var des = (t.designation || '—').replace(/</g, '&lt;');
        var list = (t.assignedStudents || []);
        var count = list.length;
        var names = list.slice(0, 3).map(function (s) { return (s.user && s.user.name) || s.rollNo || '—'; }).join(', ');
        if (count > 3) names += ' +' + (count - 3) + ' more';
        if (!count) names = '—';
        var teacherNameForModal = (t.user && t.user.name) || 'Teacher';
        return '<tr><td>' + name + '</td><td>' + email + '</td><td>' + dept + '</td><td>' + des + '</td><td>' + names.replace(/</g, '&lt;') + '</td><td><button type="button" class="btn-assign-students" data-mentor-id="' + mentorId.replace(/"/g, '&quot;') + '" data-mentor-name="' + (teacherNameForModal || '').replace(/"/g, '&quot;') + '">Assign students</button></td></tr>';
      }).join('');
      tbody.querySelectorAll('.btn-assign-students').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openAssignStudentsModal(btn.getAttribute('data-mentor-id'), btn.getAttribute('data-mentor-name'));
        });
      });
    }

    ECS_API.admin.teachers().then(function (data) {
      renderTeachersTable(data.teachers);
    }).catch(function () {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-muted">Could not load teachers.</td></tr>';
    });
  }

  loadDashboard();

  // ----- Student: "Join your meeting" block – always visible; show live sessions or placeholder -----
  var liveSessionBlock = document.getElementById('live-session-block');
  var liveSessionList = document.getElementById('live-session-list');
  var liveSessionPlaceholder = '<p class="text-muted" id="live-session-placeholder">No live meetings right now. When your mentor adds a Google Meet link to a session, it will appear here and in My next lessons.</p>';
  if (liveSessionBlock && liveSessionList && user && user.role === 'student') {
    liveSessionBlock.style.display = 'block';
    if (typeof ECS_API !== 'undefined') {
      ECS_API.student.liveSessions()
        .then(function (data) {
          var sessions = data.sessions || [];
          if (sessions.length === 0) {
            liveSessionList.innerHTML = liveSessionPlaceholder;
            return;
          }
          liveSessionList.innerHTML = sessions.map(function (s) {
            var title = (s.title || 'Meeting').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            var link = (s.meetLink || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            return '<div class="live-session-item"><span class="live-session-title">' + title + '</span> <button type="button" class="join-live" data-meet-link="' + link + '">JOIN LIVE MEETING</button></div>';
          }).join('');
          liveSessionList.querySelectorAll('.join-live').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var link = btn.getAttribute('data-meet-link');
              if (link) window.open(link, '_blank');
            });
          });
        })
        .catch(function () { liveSessionList.innerHTML = liveSessionPlaceholder; });
    } else {
      liveSessionList.innerHTML = liveSessionPlaceholder;
    }
  } else if (liveSessionBlock && user && user.role !== 'student') {
    liveSessionBlock.style.display = 'none';
  }

  // ----- Teacher: show Meet link form, load sessions, submit updates meet link -----
  var teacherSection = document.getElementById('teacher-meet-link-section');
  var meetLinkForm = document.getElementById('teacher-meet-link-form');
  var meetSessionSelect = document.getElementById('meet-session-select');
  var meetLinkInput = document.getElementById('meet-link-input');
  var meetLinkMessage = document.getElementById('meet-link-message');
  if (user && user.role === 'teacher' && typeof ECS_API !== 'undefined') {
    if (teacherSection) teacherSection.style.display = 'block';
    ECS_API.teacher.sessions()
      .then(function (data) {
        var sessions = (data.sessions || []).filter(function (s) {
          var t = (s.title || '').toLowerCase().trim();
          return t.indexOf('ui ux') === -1 && t.indexOf('ui/ux') === -1;
        });
        if (!meetSessionSelect) return;
        var options = '<option value="">Select a session</option>';
        if (sessions.length > 0) {
          options += sessions.map(function (s) {
            var id = s._id ? (typeof s._id === 'string' ? s._id : s._id.toString()) : '';
            var title = (s.title || 'Session') + (s.scheduledAt ? ' (' + new Date(s.scheduledAt).toLocaleDateString() + ')' : '');
            return '<option value="' + id + '">' + title.replace(/</g, '&lt;') + '</option>';
          }).join('');
        } else {
          options += '<option value="create-mentoring">Mentoring (create new session)</option>';
        }
        meetSessionSelect.innerHTML = options;
      })
      .catch(function () {
        if (meetSessionSelect) meetSessionSelect.innerHTML = '<option value="">Select a session</option><option value="create-mentoring">Mentoring (create new session)</option>';
      });
    if (meetLinkForm) {
      meetLinkForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var sessionId = meetSessionSelect && meetSessionSelect.value;
        var link = meetLinkInput && meetLinkInput.value.trim();
        if (!sessionId || !link) return;
        if (meetLinkMessage) meetLinkMessage.textContent = 'Saving...';

        function setMeetLink(id) {
          return ECS_API.teacher.updateSession(id, { meetLink: link, isLive: true })
            .then(function () {
              if (meetLinkMessage) {
                meetLinkMessage.textContent = 'Meet link saved. Session is now live for students.';
                meetLinkMessage.style.color = '';
              }
              return ECS_API.teacher.sessions().then(function (data) {
                var sessions = (data.sessions || []).filter(function (s) {
                  var t = (s.title || '').toLowerCase().trim();
                  return t.indexOf('ui ux') === -1 && t.indexOf('ui/ux') === -1;
                });
                if (meetSessionSelect && sessions.length > 0) {
                  meetSessionSelect.innerHTML = '<option value="">Select a session</option>' + sessions.map(function (s) {
                    var sid = s._id ? (typeof s._id === 'string' ? s._id : s._id.toString()) : '';
                    var title = (s.title || 'Session') + (s.scheduledAt ? ' (' + new Date(s.scheduledAt).toLocaleDateString() + ')' : '');
                    return '<option value="' + sid + '">' + title.replace(/</g, '&lt;') + '</option>';
                  }).join('');
                }
              });
            });
        }

        if (sessionId === 'create-mentoring') {
          var scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + 1);
          ECS_API.teacher.createSession({ title: 'Mentoring', scheduledAt: scheduledAt.toISOString(), duration: 45 })
            .then(function (res) {
              var id = res.session && (res.session._id ? res.session._id.toString() : res.session.id);
              if (!id) throw new Error('Session not created');
              return setMeetLink(id);
            })
            .catch(function (err) {
              if (meetLinkMessage) {
                meetLinkMessage.textContent = err.message || 'Failed to create session or save link.';
                meetLinkMessage.style.color = '#dc2626';
              }
            });
        } else {
          setMeetLink(sessionId).catch(function (err) {
            if (meetLinkMessage) {
              meetLinkMessage.textContent = err.message || 'Failed to save.';
              meetLinkMessage.style.color = '#dc2626';
            }
          });
        }
      });
    }
  }

  // ----- Continue on course card: show course detail modal or open Meet if session linked -----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-continue');
    if (!btn || !btn.closest('#cards-row')) return;
    var card = btn.closest('.mentor-card');
    var id = btn.getAttribute('data-session-id');
    if (id && typeof ECS_API !== 'undefined' && user && user.role === 'student') {
      btn.textContent = 'Opening...';
      ECS_API.student.meetLink(id)
        .then(function (data) {
          if (data.meetLink) window.open(data.meetLink, '_blank');
          btn.textContent = 'Continue';
        })
        .catch(function () { btn.textContent = 'Continue'; });
      return;
    }
    var titleEl = card ? card.querySelector('.card-title') : null;
    var progressEl = card ? card.querySelector('.progress-text') : null;
    var code = card ? card.getAttribute('data-course-code') : '';
    var title = titleEl ? titleEl.textContent : 'Course';
    var credits = progressEl ? progressEl.textContent : '';
    openModal(title, '<p>' + (credits ? 'Credits: ' + credits + '<br>' : '') + 'Course code: ' + (code || '—') + '</p><p class="text-muted">No live session linked. Check &quot;My next lessons&quot; for scheduled sessions.</p>');
    btn.blur();
  });

  // ----- Card bookmark: toggle and persist -----
  var BOOKMARK_KEY = 'ecs_course_bookmarks';
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); } catch (_) { return []; }
  }
  function setBookmark(code, on) {
    var arr = getBookmarks();
    var i = arr.indexOf(code);
    if (on && i < 0) arr.push(code);
    if (!on && i >= 0) arr.splice(i, 1);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(arr));
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.card-bookmark');
    if (!btn || !btn.closest('.mentor-card')) return;
    var card = btn.closest('.mentor-card');
    var code = card.getAttribute('data-course-code') || '';
    btn.classList.toggle('card-bookmark--active');
    setBookmark(code, btn.classList.contains('card-bookmark--active'));
  });
  function applyBookmarks() {
    var codes = getBookmarks();
    document.querySelectorAll('.mentor-card').forEach(function (card) {
      var code = card.getAttribute('data-course-code');
      var btn = card.querySelector('.card-bookmark');
      if (btn) btn.classList.toggle('card-bookmark--active', codes.indexOf(code) >= 0);
    });
  }

  // ----- View all lessons: scroll to lessons section -----
  var viewAllLessons = document.querySelector('.view-all-link');
  if (viewAllLessons) {
    viewAllLessons.addEventListener('click', function (e) {
      e.preventDefault();
      showPanel('mentoring');
      var panels = document.querySelectorAll('.content-panel[data-page="mentoring"]');
      if (panels.length) {
        var lessons = panels[0].querySelector('.lessons-panel');
        if (lessons) lessons.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ----- More details (recommendation card): open modal -----
  var btnMoreDetails = document.getElementById('btn-more-details');
  if (btnMoreDetails) {
    btnMoreDetails.addEventListener('click', function () {
      var title = 'Advanced Typography for Digital Products';
      var body = '<p>New course matching your interests (Design).</p><p class="text-muted">More details coming soon.</p>';
      openModal(title, body);
    });
  }

  // ----- Modal: open / close -----
  var modalOverlay = document.getElementById('modal-overlay');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalClose = document.getElementById('modal-close');
  function openModal(title, bodyHtml) {
    if (modalTitle) modalTitle.textContent = title || '';
    if (modalBody) modalBody.innerHTML = bodyHtml || '';
    if (modalOverlay) {
      modalOverlay.classList.add('is-open');
      modalOverlay.setAttribute('aria-hidden', 'false');
    }
  }
  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('is-open');
      modalOverlay.setAttribute('aria-hidden', 'true');
    }
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  // ----- Help (sidebar): open modal -----
  var helpNav = document.querySelector('.sidebar-footer .nav-item[aria-label="Help"]');
  if (helpNav) {
    helpNav.addEventListener('click', function (e) {
      e.preventDefault();
      openModal('Help', '<p>Use <strong>Mentoring</strong> for courses and next lessons.</p><p><strong>Sessions</strong> lists all upcoming sessions; <strong>Join meeting</strong> opens the Meet link.</p><p><strong>Mentors</strong> shows your assigned mentor.</p><p><strong>Progress</strong> shows attendance.</p><p>Bookmark courses with the bookmark icon on each card.</p>');
    });
  }

  // ----- Search: filter courses and session rows -----
  var searchInput = document.querySelector('.search-input');
  if (searchInput) {
    var placeholder = searchInput.getAttribute('placeholder');
    searchInput.addEventListener('focus', function () {
      searchInput.setAttribute('data-placeholder', placeholder);
    });
    searchInput.addEventListener('input', function () {
      var q = (searchInput.value || '').trim().toLowerCase();
      document.querySelectorAll('#cards-row .mentor-card').forEach(function (card) {
        var title = (card.querySelector('.card-title') || {}).textContent || '';
        var tag = (card.querySelector('.card-tag') || {}).textContent || '';
        var match = !q || title.toLowerCase().indexOf(q) >= 0 || tag.toLowerCase().indexOf(q) >= 0;
        card.style.display = match ? '' : 'none';
      });
      document.querySelectorAll('#sessions-tbody tr').forEach(function (tr) {
        if (tr.querySelector('.text-muted')) return;
        var text = tr.textContent || '';
        var match = !q || text.toLowerCase().indexOf(q) >= 0;
        tr.style.display = match ? '' : 'none';
      });
    });
  }

  // ----- Notifications: panel with list and mark all read -----
  var notifyBtn = document.getElementById('btn-notify');
  var notifyDot = document.getElementById('notify-dot');
  var notifyPanel = document.getElementById('notify-panel');
  var notifyList = document.getElementById('notify-panel-list');
  var notifyMarkRead = document.getElementById('notify-mark-read');
  function refreshNotifyDot() {
    if (typeof ECS_API === 'undefined' || !notifyDot) return;
    ECS_API.student.notifications().then(function (data) {
      var unread = (data.notifications || []).filter(function (n) { return !n.read; });
      notifyDot.style.visibility = unread.length > 0 ? 'visible' : 'hidden';
    }).catch(function () {});
  }
  function loadNotifyPanel() {
    if (!notifyList || typeof ECS_API === 'undefined') return;
    ECS_API.student.notifications().then(function (data) {
      var list = data.notifications || [];
      if (!list.length) {
        notifyList.innerHTML = '<div class="notify-item text-muted">No notifications</div>';
        return;
      }
      notifyList.innerHTML = list.map(function (n) {
        var cls = n.read ? 'notify-item' : 'notify-item unread';
        var msg = (n.message || n.title || 'Notification').replace(/</g, '&lt;');
        var id = n._id ? n._id.toString() : '';
        return '<div class="' + cls + '" data-id="' + id.replace(/"/g, '&quot;') + '">' + msg + '</div>';
      }).join('');
    }).catch(function () {
      notifyList.innerHTML = '<div class="notify-item text-muted">Could not load</div>';
    });
  }
  if (notifyBtn && notifyPanel) {
    notifyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = notifyPanel.classList.toggle('is-open');
      notifyPanel.setAttribute('aria-hidden', !open);
      if (open) loadNotifyPanel();
    });
  }
  if (notifyMarkRead && typeof ECS_API !== 'undefined') {
    notifyMarkRead.addEventListener('click', function () {
      ECS_API.notifications.markAllRead().then(function () {
        loadNotifyPanel();
        refreshNotifyDot();
      }).catch(function () {});
    });
  }
  document.addEventListener('click', function (e) {
    if (notifyPanel && notifyPanel.classList.contains('is-open') && !notifyPanel.contains(e.target) && !notifyBtn.contains(e.target)) {
      notifyPanel.classList.remove('is-open');
      notifyPanel.setAttribute('aria-hidden', 'true');
    }
  });
  refreshNotifyDot();

})();
