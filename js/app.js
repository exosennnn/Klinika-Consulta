const { createApp, ref, computed, onMounted } = Vue;

const App = {
  template: APP_TEMPLATE,
  setup() {
    const { TIME_SLOTS, DAY_NAMES, esc, fmtTime, statusLabel, statusClass, canModify } = window.KlinikaConsultaUtils;
    const swalDark = { background: '#121216', color: '#fff' };
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const currentUser = ref(null);
    const activeRole = ref('');
    const navPage = ref('dashboard');
    const sidebarOpen = ref(typeof window !== 'undefined' && window.innerWidth > 900);
    const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
    const publicPages = ['home', 'about', 'doctors', 'how', 'contact'];
    const requestedPublicPage = typeof window !== 'undefined' && window.location
      ? new URLSearchParams(window.location.search).get('page')
      : 'home';
    const publicPage = ref(publicPages.includes(requestedPublicPage) ? requestedPublicPage : 'home');
    const publicPageTitles = {
      home: 'Home',
      about: 'About',
      doctors: 'Doctors',
      how: 'How it works',
      contact: 'Contact us'
    };
    const isLoading = ref(true);
    const compactMode = ref(typeof localStorage !== 'undefined' && localStorage.getItem('klinika_consulta_compact') === '1');
    const lightMode = ref(typeof localStorage !== 'undefined' && localStorage.getItem('klinika_consulta_light') === '1');
    const notifEnabled = ref(typeof localStorage === 'undefined' || localStorage.getItem('klinika_consulta_notifs') !== '0');
    const calendarMode = ref('week');
    const calendarDate = ref(today);
    const activityLogs = ref([]);
    const messageConversations = ref([]);
    const messages = ref([]);
    const selectedConversationId = ref(null);
    const messageDraft = ref('');
    const unreadMessages = ref(0);

    const loginForm = ref({ username: '', password: '' });
    const authMode = ref('login');   // 'login' | 'register'
    const showAuth = ref(false);
    const profileForm = ref({ full_name: '', contact_number: '' });
    const registerForm = ref({ first_name: '', last_name: '', contact_number: '', username: '', password: '', confirm: '' });
    const guestBookingBusy = ref(false);
    const specialties = ref([]);
    const doctors = ref([]);
    const publicAvailability = ref({});
    const publicAvailabilityLoaded = ref(false);
    const publicAvailabilityFailed = ref(false);
    let publicAvailabilityTimer = null;
    const appointments = ref([]);
    const hasActiveAppointment = ref(false);
    const notifications = ref([]);
    const leaves = ref([]);
    const schedule = ref([]);
    const showSchedule = ref(false);
    const unreadNotifs = ref(0);
    const showNotifs = ref(false);

    // Complaint guidance uses database specialty names, never numeric IDs.
    const COMPLAINT_GUIDE = [
      ['Fever, cough, colds or general check-up','General Medicine'],
      ['My child is sick or needs a check-up','Pediatrics'],
      ['Skin rash, itching or acne','Dermatology'],
      ['High blood pressure or heart concerns','Cardiology'],
      ['Eye irritation or vision concerns','Ophthalmology'],
      ['Adult chronic illness or medication review','Internal Medicine'],
      ['Family health and preventive care','Family Medicine'],
      ['Pregnancy or women’s health','OB-GYN'],
      ['Joint, bone or muscle pain','Orthopedics'],
      ['Headaches or nerve concerns','Neurology'],
      ['Ear, nose or throat concerns','ENT'],
      ['Breathing or lung concerns','Pulmonology'],
      ['Stomach or digestive concerns','Gastroenterology'],
      ['Thyroid, diabetes or hormone concerns','Endocrinology'],
      ['Chest pain or difficulty breathing','Cardiology',true],
      ['I don’t know what I need','General Medicine',false,true]
    ];
    const chosenComplaint = ref('');
    const complaintChoices = computed(() => COMPLAINT_GUIDE.filter(item => specialties.value.some(s => s.name.toLowerCase() === item[1].toLowerCase())).map(item => ({label:item[0], specialty:item[1], emergency:!!item[2], unsure:!!item[3]})));
    const chooseComplaint = async (item) => {
      const specialty = specialties.value.find(s => s.name.toLowerCase() === item.specialty.toLowerCase());
      if (!specialty) return;
      chosenComplaint.value = item.label;
      selectedSpecialtyId.value = specialty.id;
      for (const form of Object.values(bookingForms.value)) { form.date=''; form.time=''; form.reason_for_visit=item.label; }
      if (item.emergency) await Swal.fire({icon:'warning',title:'Emergency warning',text:'If this is an emergency, go to the nearest hospital or call 911 immediately.',...swalDark});
    };
    const selectComplaint = (event) => {
      const item = complaintChoices.value.find(choice => choice.label === event.target.value);
      if (item) {
        chooseComplaint(item);
      } else {
        chooseSpecialtyManually(null);
      }
    };
    const chooseSpecialtyManually = (id) => {
      chosenComplaint.value=''; selectedSpecialtyId.value=id;
      for (const form of Object.values(bookingForms.value)) { form.date=''; form.time=''; }
    };
    const selectedSpecialtyId = ref(null);
    const bookingForms = ref({});   // { [doctorId]: { date, time } }
    const slotInfo = ref({});       // { [doctorId]: { taken: [], blocked: bool } }
    const slotRequestIds = Object.create(null);
    const timeSelectRequests = Object.create(null);

    const search = ref('');
    const statusFilter = ref('');
    let refreshTimer = null;
    let messageTimer = null;

    // ---------- Helpers ----------
    const doctorYears = (doc) => ({'Pediatrics':8,'Dermatology':7,'General Medicine':10,'Cardiology':12}[doc.specialty_name] || 6);
    const doctorFocus = (doc) => ({'Pediatrics':'Child wellness, routine consultations, and pediatric follow-up care.','Dermatology':'Skin consultations, common dermatologic concerns, and follow-up care.','General Medicine':'Primary care, general consultations, preventive care, and referrals.','Cardiology':'Heart health consultations, cardiovascular assessment, and continuing care.','Ophthalmology':'Eye health, vision screening, and eye concerns.','Internal Medicine':'Adult health, chronic conditions, and preventive assessments.','Family Medicine':'Family primary care, prevention, and referrals.','OB-GYN':'Women’s health, pregnancy, and reproductive consultations.','Orthopedics':'Bones, joints, and musculoskeletal injuries.','Neurology':'Headache, nerve, and neurological consultations.','ENT':'Ear, nose, throat, and sinus concerns.','Pulmonology':'Respiratory health and lung concerns.','Gastroenterology':'Digestive and gastrointestinal health.','Endocrinology':'Thyroid, diabetes, and hormonal health.'}[doc.specialty_name] || 'Patient consultations, assessment, and continuity of care.');

    const toast = (title, icon = 'success') => {
      Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 3500, ...swalDark });
    };

    const { api, refreshCsrf } = createApiClient({
      toast,
      isLoggedIn: () => !!currentUser.value,
      onSessionExpired: (data) => {
        currentUser.value = null;
        activeRole.value = '';
        stopRefresh();
        toast(data.message || 'Session expired. Please log in again.', 'warning');
      }
    });

    const busy = async (fn) => {
      isLoading.value = true;
      try { return await fn(); } finally { isLoading.value = false; }
    };

    const navigatePublic = (page) => {
      if (!publicPages.includes(page)) return;
      publicPage.value = page;
      if (page === 'doctors' && !currentUser.value) {
        loadPublicAvailability();
        startPublicAvailabilityRefresh();
      } else {
        stopPublicAvailabilityRefresh();
      }
      if (typeof document !== 'undefined') document.title = `${publicPageTitles[page]} | Klinika Consulta`;
      if (typeof window !== 'undefined' && window.location && window.history) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.pushState({ publicPage: page }, '', url);
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    const syncPublicPage = () => {
      if (typeof window === 'undefined' || !window.location) return;
      const page = new URLSearchParams(window.location.search).get('page');
      publicPage.value = publicPages.includes(page) ? page : 'home';
      if (publicPage.value === 'doctors' && !currentUser.value) {
        loadPublicAvailability();
        startPublicAvailabilityRefresh();
      } else {
        stopPublicAvailabilityRefresh();
      }
      if (typeof document !== 'undefined') document.title = `${publicPageTitles[publicPage.value]} | Klinika Consulta`;
    };

    // ---------- Session ----------
    const stopPublicAvailabilityRefresh = () => {
      if (publicAvailabilityTimer) clearInterval(publicAvailabilityTimer);
      publicAvailabilityTimer = null;
    };
    const startPublicAvailabilityRefresh = () => {
      stopPublicAvailabilityRefresh();
      publicAvailabilityTimer = setInterval(() => {
        if ((publicPage.value === 'doctors' && !currentUser.value) ||
            (activeRole.value === 'patient' && navPage.value === 'booking')) {
          loadPublicAvailability();
        }
      }, 30000);
    };
    const startRefresh = () => {
      stopRefresh();
      refreshTimer = setInterval(() => {
        if (currentUser.value && !Swal.isVisible()) {
          loadAppointments(); loadNotifications(); loadLeaves(); loadSchedule();
          refreshBookingAvailability();
        }
      }, 30000);
      if (['patient','doctor'].includes(activeRole.value)) {
        messageTimer = setInterval(() => { if (currentUser.value && !Swal.isVisible()) { loadMessages(selectedConversationId.value, true); loadNotifications(); } }, 4000);
      }
    };
    const stopRefresh = () => { if (refreshTimer) clearInterval(refreshTimer); if (messageTimer) clearInterval(messageTimer); refreshTimer = null; messageTimer = null; };

    const checkSession = async () => {
      await busy(async () => {
        const data = await api('backend/api/check_session.php', null, { silent: true });
        if (data && data.authenticated) {
          currentUser.value = data.user;
          activeRole.value = data.user.role;
          stopPublicAvailabilityRefresh();
          navPage.value = 'dashboard';
          await loadData();
          startRefresh();
        } else {
          currentUser.value = null;
          await loadPublicOverview();
        }
      });
    };

    const handleLogin = async () => {
      await busy(async () => {
        const data = await api('backend/api/login.php', { username: loginForm.value.username.trim(), password: loginForm.value.password });
        if (data && data.success) {
          loginForm.value = { username: '', password: '' };
          Swal.fire({
            icon: 'success',
            title: 'Welcome back!',
            text: 'You are signed in.',
            timer: 1800,
            showConfirmButton: false,
            ...swalDark
          });
          currentUser.value = data.user;
          activeRole.value = data.user.role;
          stopPublicAvailabilityRefresh();
          navPage.value = 'dashboard';
          await loadData();
          startRefresh();
        }
      });
    };

    const handleRegister = async () => {
      if (registerForm.value.email && !registerForm.value.email_verification_token) { toast('Verify your email before registering.','error'); return; }
      const f = registerForm.value;
      const firstName = f.first_name.trim().replace(/\s+/g, ' ');
      const lastName = f.last_name.trim().replace(/\s+/g, ' ');
      const namePattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
      if (firstName.length < 2 || firstName.length > 50 || !namePattern.test(firstName)) {
        toast('Enter a valid first name using letters only.', 'error'); return;
      }
      if (lastName.length < 2 || lastName.length > 50 || !namePattern.test(lastName)) {
        toast('Enter a valid last name using letters only.', 'error'); return;
      }
      if (!/^09[0-9]{9}$/.test(f.contact_number)) {
        toast('Invalid number.', 'error'); return;
      }
      if (f.password !== f.confirm) { toast('Passwords do not match.', 'error'); return; }
      await busy(async () => {
        const data = await api('backend/api/register.php', {
          first_name: firstName, last_name: lastName, contact_number: f.contact_number,
          username: f.username.trim(), password: f.password, email: f.email || '', email_verification_token: f.email_verification_token || ''
        });
        if (data && data.success) {
          loginForm.value = { username: data.username || f.username.trim(), password: '' };
          registerForm.value = { first_name: '', last_name: '', contact_number: '', username: '', password: '', confirm: '' };
          authMode.value = 'login';
          toast('Account created. Please log in.');
        }
      });
    };

    const forgotPassword = async () => {
      const ask = await Swal.fire({title:'Forgot password',html:'<input id="reset-user" class="swal2-input" placeholder="Username"><input id="reset-email" type="email" class="swal2-input" placeholder="Verified email address">',showCancelButton:true,confirmButtonText:'Send recovery code',...swalDark,preConfirm:()=>({username:document.getElementById('reset-user').value.trim(),email:document.getElementById('reset-email').value.trim()})});
      if(!ask.value)return;
      const sent=await api('backend/api/password_recovery.php',{...ask.value,action:'request'});if(!sent?.success)return;
      const reset=await Swal.fire({title:'Reset password',text:'Check your verified email for the 6-digit code. It expires after 5 minutes.',html:'<input id="reset-code" class="swal2-input" placeholder="6-digit code" maxlength="6"><input id="reset-pass" type="password" class="swal2-input" placeholder="New password (8+ characters)">',showCancelButton:true,confirmButtonText:'Update password',...swalDark,preConfirm:()=>({code:document.getElementById('reset-code').value.trim(),new_password:document.getElementById('reset-pass').value})});
      if(!reset.value)return;
      const done=await api('backend/api/password_recovery.php',{...ask.value,...reset.value,action:'reset'});if(done?.success)Swal.fire({title:'Password updated',text:'You can now log in with your new password.',icon:'success',...swalDark});
    };
    const verifyRegistrationEmail = async () => {
      const f=registerForm.value;const email=(f.email||'').trim().toLowerCase();
      if(!email||!/^09[0-9]{9}$/.test(f.contact_number)||!f.first_name.trim()||!f.last_name.trim()){toast('Enter your name, phone and email first.','error');return;}
      const sent=await api('backend/api/guest_send_otp.php',{full_name:f.first_name.trim()+' '+f.last_name.trim(),contact_number:f.contact_number,email,channel:'email'});
      if(!sent?.success)return;
      const result=await Swal.fire({title:'Verify email',input:'text',inputLabel:'Enter the 6-digit email code',inputAttributes:{maxlength:6,inputmode:'numeric'},showCancelButton:true,...swalDark});if(!result.value)return;
      const verified=await api('backend/api/guest_verify_otp.php',{token:sent.token,code:result.value.trim()});
      if(verified?.success){f.email_verification_token=verified.verification_token;toast('Email verified. You can create your account.');}
    };
    const linkWalkinCoordinator = async (app) => {
      const result=await Swal.fire({title:'Link guest / walk-in history',html:`<p class="text-xs text-zinc-400">Confirm the patient's identity in person before linking. Check the tracking code and patient identity in person. The registered mobile number must match the booking; record what was checked.</p><input id="walk-link-user" class="swal2-input" placeholder="Registered patient username"><textarea id="walk-link-note" class="swal2-textarea" placeholder="Verification note (e.g., patient presented clinic slip and ID; do not record ID numbers)"></textarea><label style="display:block;margin:12px"><input id="walk-link-check" type="checkbox"> I checked the patient identity in person</label>`,showCancelButton:true,confirmButtonText:'Link verified patient',...swalDark,preConfirm:()=>({reference_code:app.reference_code,patient_username:document.getElementById('walk-link-user').value.trim(),identity_checked:document.getElementById('walk-link-check').checked,verification_note:document.getElementById('walk-link-note').value.trim()})});
      if(!result.value)return;const r=await api('backend/api/link_walkin.php',result.value);if(r?.success){toast(r.message);await loadData();}
    };
    const handleLogout = async () => {
      const confirm = await Swal.fire({
        title: 'Log out of Klinika Consulta?',
        text: 'Are you sure you want to end your current session?',
        icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, log out',
        cancelButtonText: 'Stay logged in', confirmButtonColor: '#dc2626', ...swalDark
      });
      if (!confirm.isConfirmed) return;
      await busy(async () => {
        const logoutResult = await api('backend/api/logout.php', {}, { silent: true });
        if (!logoutResult || !logoutResult.success) { toast('Logout failed. Please try again.', 'error'); return; }
        // Privacy-friendly shared-device default: reset display preferences for the next visitor.
        lightMode.value = false;
        compactMode.value = false;
        localStorage.removeItem('klinika_consulta_light');
        localStorage.removeItem('klinika_consulta_compact');
        document.documentElement.classList.remove('dm-light', 'dm-compact');
        await refreshCsrf();
        stopRefresh();
        currentUser.value = null;
        activeRole.value = '';
        navPage.value = 'dashboard';
        appointments.value = [];
        notifications.value = [];
        unreadNotifs.value = 0;
        showNotifs.value = false;
        selectedSpecialtyId.value = null;
        messageConversations.value=[]; messages.value=[]; selectedConversationId.value=null; unreadMessages.value=0;
      });
      Swal.fire({
        icon: 'success',
        title: 'Logged out',
        text: 'You have been safely signed out.',
        timer: 1800,
        showConfirmButton: false,
        ...swalDark
      });
      showAuth.value = false;
    };

    const loadPublicOverview = async () => {
      const ov = await api('backend/api/get_overview.php', null, { silent: true });
      if (ov && ov.success) {
        specialties.value = ov.specialties || [];
        doctors.value = ov.doctors || [];
        if (publicPage.value === 'doctors') {
          await loadPublicAvailability();
          startPublicAvailabilityRefresh();
        }
      }
    };

    const loadPublicAvailability = async () => {
      if (!publicAvailabilityLoaded.value) publicAvailabilityFailed.value = false;
      const data = await api('backend/api/get_public_availability.php');
      if (data && data.success) {
        publicAvailability.value = data.availability || {};
      } else {
        publicAvailability.value = {};
        publicAvailabilityFailed.value = true;
      }
      publicAvailabilityLoaded.value = true;
    };

    const openProfile = async () => {
      const data = await api('backend/api/profile.php', null, { silent: true });
      if (!data || !data.success) return;
      const u = data.user;
      const { value } = await Swal.fire({
        title: 'My Profile',
        html: `<div style="text-align:left"><label class="swal-label">Full name</label><input id="pf-name" class="swal2-input" value="${esc(u.full_name || '')}"><label class="swal-label">Contact number</label><input id="pf-contact" class="swal2-input" value="${esc(u.contact_number || '')}"><div class="profile-meta">Username: <b>${esc(u.username || '')}</b><br>Role: <b>${esc(u.role || '')}</b></div></div>`,
        showCancelButton: true, confirmButtonText: 'Save changes', ...swalDark,
        preConfirm: () => ({ full_name: document.getElementById('pf-name').value.trim(), contact_number: document.getElementById('pf-contact').value.trim() })
      });
      if (!value) return;
      const r = await api('backend/api/profile.php', value);
      if (r && r.success) { currentUser.value.full_name = r.user.full_name; toast('Profile updated.'); }
    };

    const openSettings = async () => {
      const { value } = await Swal.fire({
        title: 'Account Settings',
        html: `<div style="text-align:left"><p class="settings-help">Change your password below. Use at least 8 characters.</p><label class="swal-label">Current password</label><input id="st-old" type="password" class="swal2-input"><label class="swal-label">New password</label><input id="st-new" type="password" class="swal2-input"><label class="swal-label">Confirm new password</label><input id="st-confirm" type="password" class="swal2-input"></div>`,
        showCancelButton: true, confirmButtonText: 'Update password', ...swalDark,
        preConfirm: () => { const a=document.getElementById('st-old').value,b=document.getElementById('st-new').value,c=document.getElementById('st-confirm').value; if(!a||b.length<8){Swal.showValidationMessage('Complete the fields and use at least 8 characters.');return false;} if(b!==c){Swal.showValidationMessage('New passwords do not match.');return false;} return {current_password:a,new_password:b}; }
      });
      if (!value) return;
      const r = await api('backend/api/change_password.php', value);
      if (r && r.success) toast('Password updated.');
    };

    // ---------- Data ----------
    const loadAppointments = async () => {
      const data = await api('backend/api/get_admin_appointments.php', null, { silent: true });
      if (data && data.success) {
        appointments.value = data.appointments || [];
        hasActiveAppointment.value = activeRole.value === 'patient'
          ? (typeof data.has_active_appointment === 'boolean'
            ? data.has_active_appointment
            : appointments.value.some(app => !['Completed', 'Cancelled'].includes(app.status)))
          : false;
      }
    };

    const loadSchedule = async () => {
      if (activeRole.value !== 'coordinator') { schedule.value = []; return; }
      const data = await api('backend/api/get_schedule.php', null, { silent: true });
      if (data && data.success) schedule.value = data.doctors || [];
    };

    const loadLeaves = async () => {
      if (!['coordinator', 'doctor'].includes(activeRole.value)) { leaves.value = []; return; }
      const data = await api('backend/api/get_leaves.php', null, { silent: true });
      if (data && data.success) leaves.value = data.leaves || [];
    };

    const loadNotifications = async (markRead = false) => {
      const data = await api(`backend/api/get_notifications.php${markRead ? '?mark_read=1' : ''}`, null, { silent: true });
      if (data && data.success) {
        notifications.value = data.notifications || [];
        unreadNotifs.value = data.unread_count || 0;
      }
    };

    const loadActivity = async () => {
      if (activeRole.value !== 'coordinator') { activityLogs.value=[]; return; }
      const data = await api('backend/api/get_activity.php', null, { silent:true });
      if (data && data.success) activityLogs.value=data.logs||[];
    };

    const loadMessages = async (appointmentId = null, silent = false) => {
      if (!['patient','doctor'].includes(activeRole.value)) return;
      const id = appointmentId || selectedConversationId.value;
      const data = await api('backend/api/messages.php' + (id ? `?appointment_id=${encodeURIComponent(id)}` : ''), null, { silent });
      if (data && data.success) {
        messageConversations.value = data.conversations || [];
        unreadMessages.value = Number(data.unread_total || 0);
        if (id) { selectedConversationId.value = Number(id); messages.value = data.messages || []; }
      }
    };
    const openConversation = async (c) => { selectedConversationId.value=Number(c.appointment_id); await loadMessages(c.appointment_id); };
    const selectedConversationTitle = computed(() => { const c=messageConversations.value.find(x=>Number(x.appointment_id)===Number(selectedConversationId.value)); return c ? (activeRole.value==='patient' ? c.doctor_name : c.patient_name) : ''; });
    const sendMessage = async () => {
      const text=(messageDraft.value||'').trim(); if(!text||!selectedConversationId.value) return;
      const data=await api('backend/api/messages.php',{appointment_id:selectedConversationId.value,message:text});
      if(data&&data.success){ messageDraft.value=''; await loadMessages(selectedConversationId.value,true); }
    };

    const loadData = async () => {
      const ov = await api('backend/api/get_overview.php');
      if (ov && ov.success) {
        const docs = ov.doctors || [];
        const forms = {};
        docs.forEach(d => { forms[d.id] = bookingForms.value[d.id] || { date: '', time: '', reason_for_visit: '' }; });
        bookingForms.value = forms;
        specialties.value = ov.specialties || [];
        doctors.value = docs;
      }
      await loadAppointments();
      await loadNotifications();
      await loadLeaves();
      await loadSchedule();
      await loadActivity();
      if (['patient','doctor'].includes(activeRole.value)) await loadMessages(null, true);
    };

    const toggleNotifDropdown = async () => {
      showNotifs.value = !showNotifs.value;
      if (showNotifs.value && unreadNotifs.value > 0) await loadNotifications(true);
    };

    const openDoctorRequests = async () => {
      showNotifs.value = false;
      navPage.value = 'appointments';
      await loadAppointments();
    };

    const canReviewNotification = (notification) =>
      activeRole.value === 'doctor' &&
      ['New Appointment Request', 'New Appointment for Review', 'Appointment Reassigned'].includes(notification.title);

    // ---------- Computed ----------
    const filteredDoctors = computed(() => {
      if (!selectedSpecialtyId.value) return [];
      return doctors.value.filter(d => d.specialty_id == selectedSpecialtyId.value);
    });

    // Doctor: Pending first, then upcoming Booked
    const doctorApps = computed(() => {
      const weekAgo = new Date(Date.now() - 7 * 864e5 - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      // Upcoming Booked, and recently finished ones without follow-up advice (so the doctor can still add it)
      const rows = appointments.value.filter(a => a.status === 'Pending' || a.status === 'Checked_In' ||
        (a.status === 'Booked' && (a.appointment_date >= today || (a.appointment_date >= weekAgo && !a.followup_timeframe))) ||
        (a.status === 'Completed' && a.appointment_date >= weekAgo));
      const rank = a => a.status === 'Pending' ? 0 : a.status === 'Checked_In' ? 1 : 2;
      return rows.sort((a, b) => rank(a) - rank(b)
        || (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time));
    });

    const followupAppointments = computed(() => appointments.value.filter(a => {
      if (activeRole.value === 'doctor') return a.status === 'Completed';
      return !!a.followup_timeframe || a.status === 'Proposed';
    }).sort((a,b) => (b.appointment_date+b.appointment_time).localeCompare(a.appointment_date+a.appointment_time)));

    const filteredAppointments = computed(() => {
      const q = search.value.trim().toLowerCase();
      return appointments.value.filter(a => {
        if (statusFilter.value && a.status !== statusFilter.value) return false;
        if (!q) return true;
        return [a.reference_code, a.patient_name, a.doctor_name, a.specialty_name, a.contact_number]
          .some(v => (v || '').toLowerCase().includes(q));
      });
    });

    const workdayLabel = (arr) => (arr || []).map(n => DAY_NAMES[n - 1]).join(', ') || '—';
    const defaultWorkPeriods = [{ start: '09:00', end: '12:00' }, { start: '13:30', end: '16:00' }];
    const scheduleForDay = (doc, day) => {
      if (!doc.work_schedule) return defaultWorkPeriods;
      return doc.work_schedule[day] || doc.work_schedule[String(day)] || [];
    };
    const workPeriodOptions = (session, boundary, selected) => {
      const values = session === 'AM'
        ? (boundary === 'start' ? ['09:00','09:30','10:00','10:30','11:00','11:30'] : ['09:30','10:00','10:30','11:00','11:30','12:00'])
        : (boundary === 'start' ? ['13:30','14:00','14:30','15:00','15:30'] : ['14:00','14:30','15:00','15:30','16:00']);
      return values.map(value => `<option value="${value}" ${value === selected ? 'selected' : ''}>${fmtTime(value + ':00')}</option>`).join('');
    };
    const doctorScheduleLabel = (doc) => {
      const dayTimes = (doc.workdays || []).map(day => {
        const periods = scheduleForDay(doc, day).map(period =>
          `${fmtTime(period.start + ':00')}–${fmtTime(period.end + ':00')}`);
        return `${DAY_NAMES[day - 1]} ${periods.join(' / ')}`;
      });
      return dayTimes.length ? dayTimes.join(' · ') : '—';
    };
    const workScheduleEditor = (selectedDays = [], storedSchedule = null) => {
      const rows = DAY_NAMES.map((day, index) => {
        const dayNumber = index + 1;
        const periods = storedSchedule
          ? (storedSchedule[dayNumber] || storedSchedule[String(dayNumber)] || [])
          : defaultWorkPeriods;
        const am = periods.find(period => period.start < '12:00') || defaultWorkPeriods[0];
        const pm = periods.find(period => period.start >= '13:30') || defaultWorkPeriods[1];
        return `<div class="doctor-schedule-editor-row" data-schedule-day="${dayNumber}">
          <label class="doctor-schedule-day"><input type="checkbox" class="schedule-day" ${selectedDays.includes(dayNumber) ? 'checked' : ''}><b>${day}</b></label>
          <label class="doctor-schedule-period"><input type="checkbox" class="schedule-period-am" ${periods.some(period => period.start < '12:00') ? 'checked' : ''}><span>AM</span>
            <select class="schedule-start-am" aria-label="${day} morning start">${workPeriodOptions('AM', 'start', am.start)}</select>
            <span>to</span><select class="schedule-end-am" aria-label="${day} morning end">${workPeriodOptions('AM', 'end', am.end)}</select>
          </label>
          <label class="doctor-schedule-period"><input type="checkbox" class="schedule-period-pm" ${periods.some(period => period.start >= '13:30') ? 'checked' : ''}><span>PM</span>
            <select class="schedule-start-pm" aria-label="${day} afternoon start">${workPeriodOptions('PM', 'start', pm.start)}</select>
            <span>to</span><select class="schedule-end-pm" aria-label="${day} afternoon end">${workPeriodOptions('PM', 'end', pm.end)}</select>
          </label>
        </div>`;
      }).join('');
      return `<div class="doctor-schedule-editor"><div class="doctor-schedule-editor-help">Select each workday and set one or both sessions. The gap between morning and afternoon is the doctor's break; clinic lunch closure is 12:00–1:30 PM.</div>${rows}</div>`;
    };
    const readWorkScheduleEditor = () => {
      const days = [];
      const workSchedule = {};
      for (const row of document.querySelectorAll('.doctor-schedule-editor-row')) {
        if (!row.querySelector('.schedule-day').checked) continue;
        const day = Number(row.dataset.scheduleDay);
        const periods = [];
        for (const session of ['am', 'pm']) {
          if (!row.querySelector(`.schedule-period-${session}`).checked) continue;
          const start = row.querySelector(`.schedule-start-${session}`).value;
          const end = row.querySelector(`.schedule-end-${session}`).value;
          if (start >= end) {
            Swal.showValidationMessage(`The ${session.toUpperCase()} end time must be after its start time.`);
            return false;
          }
          periods.push({ start, end });
        }
        if (!periods.length) {
          Swal.showValidationMessage('Choose at least one work period for each selected day.');
          return false;
        }
        days.push(day);
        workSchedule[day] = periods;
      }
      if (!days.length) {
        Swal.showValidationMessage('Select at least one workday.');
        return false;
      }
      return { days, work_schedule: workSchedule };
    };
    const downloadDoctorSchedule = () => {
      const csvCell = (value) => {
        const text = String(value ?? '');
        const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
        return `"${safeText.replace(/"/g, '""')}"`;
      };
      const rows = [
        ['Specialty', 'Doctor', 'Workdays', 'Doctor work hours'],
        ...doctors.value.map(doc => [
          doc.specialty_name,
          doc.name,
          doc.available_days || 'By schedule',
          doctorScheduleLabel(doc)
        ])
      ];
      const csv = '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `klinika-consulta-doctor-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const hasCoordAction = (app) =>
      (app.status === 'Pending' && !Number(app.forwarded_to_doctor)) ||
      app.status === 'Needs_Reassignment' ||
      ((app.status === 'Booked' || app.status === 'Proposed') && app.patient_id && !Number(app.patient_notified)) ||
      (app.status === 'Completed' && app.followup_timeframe && !Number(app.followup_relayed));

    const myDoctor = computed(() =>
      doctors.value.find(d => currentUser.value && d.id == currentUser.value.doctor_id) || null);

    const pendingLeaves = computed(() => leaves.value.filter(l => l.status === 'Pending'));

    const stageText = (app) => Number(app.needs_reassignment)
      ? 'Doctor declined; waiting for the Coordinator to reassign'
      : Number(app.forwarded_to_doctor)
        ? 'With the doctor — awaiting decision'
        : 'Waiting for the Coordinator to forward to the doctor';

    const appointmentNextStep = (app) => {
      if (Number(app.needs_reassignment) || app.status === 'Needs_Reassignment') return 'The clinic is arranging a replacement doctor or time. Please wait for an update.';
      if (app.status === 'Proposed') return 'Review the proposed follow-up time and confirm or decline it.';
      if (app.status === 'Pending') return Number(app.doctor_accepted)
        ? 'The doctor has accepted. The clinic will send your confirmed appointment details.'
        : Number(app.forwarded_to_doctor)
          ? 'Your request is with the doctor for review. The clinic will notify you when it is confirmed.'
          : 'Your request was received and is waiting for clinic review.';
      if (app.status === 'Booked') return 'Your visit is confirmed. Please arrive at the clinic at the scheduled time.';
      if (app.status === 'Checked_In') return 'You are checked in. Please wait for the care team.';
      if (app.status === 'Completed') return 'This visit is complete.';
      return '';
    };

    const statusCounts = computed(() => {
      const c = st => appointments.value.filter(a => a.status === st).length;
      return [
        { label: 'Pending', count: c('Pending'), color: 'text-amber-400' },
        { label: 'Booked', count: c('Booked'), color: 'text-emerald-400' },
        { label: 'Needs Reassignment', count: c('Needs_Reassignment'), color: 'text-red-400' },
        { label: 'Cancelled', count: c('Cancelled'), color: 'text-zinc-400' }
      ];
    });

    const activeAppointments = computed(() => appointments.value.filter(a => !['Completed','Cancelled','Declined'].includes(a.status)));
    const historyAppointments = computed(() => appointments.value.filter(a => ['Completed','Cancelled','Declined'].includes(a.status) || a.appointment_date < today).slice().sort((a,b)=>(b.appointment_date+b.appointment_time).localeCompare(a.appointment_date+a.appointment_time)));
    const todayQueue = computed(() => appointments.value.filter(a => a.appointment_date === today && ['Booked','Checked_In','Completed'].includes(a.status)).slice().sort((a,b)=>a.appointment_time.localeCompare(b.appointment_time)));
    const todayPendingRequests = computed(() => appointments.value.filter(a => a.appointment_date === today && ['Pending','Needs_Reassignment','Proposed'].includes(a.status)).slice().sort((a,b)=>a.appointment_time.localeCompare(b.appointment_time)));
    const completionRate = computed(() => appointments.value.length ? Math.round(appointments.value.filter(a=>a.status==='Completed').length / appointments.value.length * 100) : 0);
    const specialtyReport = computed(() => {
      const total = Math.max(1, appointments.value.length);
      return specialties.value.map(s => { const count=appointments.value.filter(a=>a.specialty_id==s.id).length; return {name:s.name,count,percent:Math.round(count/total*100)}; }).sort((a,b)=>b.count-a.count);
    });
    const calendarItems = computed(() => {
      const base=new Date(calendarDate.value+'T00:00:00');
      let start=new Date(base), end=new Date(base);
      if(calendarMode.value==='week'){ const n=(base.getDay()+6)%7; start.setDate(base.getDate()-n); end=new Date(start); end.setDate(start.getDate()+6); }
      if(calendarMode.value==='month'){ start=new Date(base.getFullYear(),base.getMonth(),1); end=new Date(base.getFullYear(),base.getMonth()+1,0); }
      const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
      return appointments.value.filter(a=>a.appointment_date>=iso(start)&&a.appointment_date<=iso(end)).slice().sort((a,b)=>(a.appointment_date+a.appointment_time).localeCompare(b.appointment_date+b.appointment_time));
    });
    const calendarTitle = computed(()=> calendarMode.value==='day' ? calendarDate.value : calendarMode.value==='week' ? 'Week of '+calendarDate.value : new Date(calendarDate.value+'T00:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'}));
    const moveCalendar = n => { const d=new Date(calendarDate.value+'T00:00:00'); d.setDate(d.getDate()+n*(calendarMode.value==='day'?1:calendarMode.value==='week'?7:30)); calendarDate.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
    const toggleLightMode=()=>{ lightMode.value=!lightMode.value; localStorage.setItem('klinika_consulta_light',lightMode.value?'1':'0'); document.documentElement.classList.toggle('dm-light',lightMode.value); };
    const toggleNotifPref=()=>{ notifEnabled.value=!notifEnabled.value; localStorage.setItem('klinika_consulta_notifs',notifEnabled.value?'1':'0'); toast(notifEnabled.value?'Notification indicators enabled.':'Notification indicators muted.'); };
    const toggleCompactMode = () => { compactMode.value=!compactMode.value; if(typeof localStorage!=='undefined') localStorage.setItem('klinika_consulta_compact', compactMode.value?'1':'0'); if(typeof document!=='undefined') document.documentElement.classList.toggle('dm-compact',compactMode.value); toast(compactMode.value?'Compact view enabled.':'Comfortable view enabled.'); };
    const openPatientBooking = () => {
      navPage.value = 'booking';
      if (activeRole.value === 'patient') {
        loadPublicAvailability();
        startPublicAvailabilityRefresh();
      }
    };
    const availableDatesForDoctor = (doctorId) => publicAvailability.value[doctorId] || [];
    const availableWeekdaysForDoctor = (doctorId) => {
      const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dates = availableDatesForDoctor(doctorId);
      const openWeekdays = new Set(dates.map(item => (new Date(`${item.date}T00:00:00`).getDay() + 6) % 7));
      return weekdayNames
        .map((name, index) => ({ index, name }))
        .filter(day => openWeekdays.has(day.index));
    };
    const isBookingWeekdaySelected = (doctorId, weekdayIndex) => {
      const date = bookingForms.value[doctorId]?.date;
      return !!date && (new Date(`${date}T00:00:00`).getDay() + 6) % 7 === weekdayIndex;
    };
    const selectAvailableWeekday = async (doc, weekdayIndex) => {
      const dateInfo = availableDatesForDoctor(doc.id).find(item =>
        (new Date(`${item.date}T00:00:00`).getDay() + 6) % 7 === weekdayIndex
      );
      if (!dateInfo) {
        await loadPublicAvailability();
        return;
      }
      await selectAvailableDate(doc, dateInfo.date);
    };
    const selectAvailableDate = async (doc, date) => {
      const dateInfo = availableDatesForDoctor(doc.id).find(item => item.date === date);
      if (!dateInfo || !dateInfo.slots.length) {
        await loadPublicAvailability();
        return;
      }
      bookingForms.value[doc.id].date = date;
      await onDateChange(doc);
    };
    const bookWithDoctor = (doc) => {
      selectedSpecialtyId.value = doc.specialty_id;
      openPatientBooking();
      setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    const showAppointmentDetails = async (app) => {
      const stages = [
        ['Submitted', true], ['Coordinator', Number(app.forwarded_to_doctor)||app.status!=='Pending'],
        ['Doctor', Number(app.doctor_accepted)||['Booked','Checked_In','Completed'].includes(app.status)],
        ['Confirmed', Number(app.patient_notified)&&['Booked','Checked_In','Completed'].includes(app.status)],
        ['Check-in', ['Checked_In','Completed'].includes(app.status)], ['Completed', app.status==='Completed']
      ];
      const timeline=stages.map(([n,d])=>`<div class="modal-stage ${d?'done':''}"><i></i><span>${n}</span></div>`).join('');
      await Swal.fire({title:'Appointment Details',html:`<div class="appointment-modal"><div><span>Reference</span><b>${esc(app.reference_code||'')}</b></div><div><span>Patient</span><b>${esc(app.patient_name||'')}</b></div><div><span>Doctor</span><b>${esc(app.doctor_name||'')}</b></div><div><span>Specialty</span><b>${esc(app.specialty_name||'')}</b></div><div><span>Schedule</span><b>${esc(app.appointment_date||'')} · ${esc(fmtTime(app.appointment_time)||'')}</b></div><div><span>Status</span><b>${esc(statusLabel(app.status))}</b></div>${app.reason_for_visit?`<div><span>Reason for visit</span><b>${esc(app.reason_for_visit)}</b></div>`:''}</div><div class="modal-timeline">${timeline}</div>${app.followup_timeframe?`<div class="modal-note"><b>Follow-up:</b> ${esc(app.followup_timeframe)}<br>${esc(app.followup_notes||'')}</div>`:''}${app.decline_reason?`<div class="modal-note danger"><b>Reason:</b> ${esc(app.decline_reason)}</div>`:''}`,confirmButtonText:'Close',...swalDark});
    };

    const printAppointment = (app) => {
      const w = window.open('', '_blank', 'width=760,height=760');
      if (!w) { toast('Allow pop-ups to print the appointment slip.', 'warning'); return; }
      const html = `<!doctype html><html><head><title>Klinika Consulta Appointment ${esc(app.reference_code||'')}</title><style>body{font-family:Arial,sans-serif;padding:36px;color:#111} .head{border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:24px} h1{margin:0;color:#2563eb} .row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:10px 0}.label{color:#666}.note{margin-top:24px;padding:14px;background:#f3f4f6;border-radius:8px} @media print{button{display:none}}</style></head><body><div class="head"><h1>Klinika Consulta</h1><div>Appointment Confirmation Slip</div></div><div class="row"><span class="label">Reference</span><b>${esc(app.reference_code||'')}</b></div><div class="row"><span class="label">Patient</span><b>${esc(app.patient_name||currentUser.value?.full_name||'')}</b></div><div class="row"><span class="label">Doctor</span><b>${esc(app.doctor_name||'')}</b></div><div class="row"><span class="label">Specialty</span><b>${esc(app.specialty_name||'')}</b></div><div class="row"><span class="label">Date & time</span><b>${esc(app.appointment_date||'')} ${esc(fmtTime(app.appointment_time)||'')}</b></div><div class="row"><span class="label">Status</span><b>${esc(statusLabel(app.status))}</b></div>${app.reason_for_visit?`<div class="row"><span class="label">Reason for visit</span><b>${esc(app.reason_for_visit)}</b></div>`:''}<div class="note">Please arrive a few minutes before your scheduled time and present this reference code at the clinic.</div><br><button onclick="window.print()">Print</button></body></html>`;
      w.document.write(html); w.document.close(); w.focus();
    };

    // ---------- Booking (Patient) ----------
    const isTaken = (docId, t) => !!(slotInfo.value[docId] && slotInfo.value[docId].taken.includes(t));
    const isSlotDisabled = (docId, t) => {
      const info = slotInfo.value[docId];
      const form = bookingForms.value[docId];
      return hasActiveAppointment.value || !form?.date || !info || info.loading || info.failed || info.blocked ||
        !info.slots?.includes(t) || isTaken(docId, t);
    };

    const canSubmit = (doc) => {
      if (hasActiveAppointment.value) return false;
      const f = bookingForms.value[doc.id];
      if (!f || !f.date || !f.time) return false;
      const info = slotInfo.value[doc.id];
      return !!info && !info.loading && !info.failed && !info.blocked &&
        info.slots?.includes(f.time) && !isTaken(doc.id, f.time);
    };

    const onDateChange = async (doc) => {
      const f = bookingForms.value[doc.id];
      f.time = '';
      if (!f.date) {
        slotRequestIds[doc.id] = (slotRequestIds[doc.id] || 0) + 1;
        delete slotInfo.value[doc.id];
        return;
      }
      await refreshDoctorSlots(doc, f.date, false);
    };

    const refreshDoctorSlots = async (doc, date, silent = true) => {
      const requestId = slotRequestIds[doc.id] = (slotRequestIds[doc.id] || 0) + 1;
      const current = slotInfo.value[doc.id] || { taken: [], slots: [], blocked: false, failed: false };
      slotInfo.value[doc.id] = { ...current, loading: true };
      const data = await api(
        `backend/api/get_booked_slots.php?doctor_id=${doc.id}&date=${encodeURIComponent(date)}`,
        null,
        { silent }
      );
      if (slotRequestIds[doc.id] !== requestId || bookingForms.value[doc.id]?.date !== date) return;
      if (data && data.success) {
        slotInfo.value[doc.id] = { taken: data.taken || [], slots: data.slots || [], blocked: !!data.blocked, loading: false, failed: false };
        if (bookingForms.value[doc.id].time &&
            (!data.slots?.includes(bookingForms.value[doc.id].time) || isTaken(doc.id, bookingForms.value[doc.id].time))) {
          bookingForms.value[doc.id].time = '';
        }
      } else {
        slotInfo.value[doc.id] = { taken: [], blocked: false, loading: false, failed: true };
      }
    };

    const refreshBookingAvailability = () => {
      if (activeRole.value !== 'patient' || navPage.value !== 'booking') return;
      doctors.value.forEach(doc => {
        const date = bookingForms.value[doc.id]?.date;
        if (date) refreshDoctorSlots(doc, date);
      });
    };

    const submitReservation = async (doc) => {
      if (hasActiveAppointment.value) {
        toast('Complete or cancel your active appointment before booking another.', 'warning');
        return;
      }
      const f = bookingForms.value[doc.id];
      if (!f || !f.date || !f.time) { toast('Select a date and time first', 'warning'); return; }
      if (f.date < today) { toast('Past dates are not allowed', 'warning'); return; }

      await busy(async () => {
        const data = await api('backend/api/book.php', {
          specialty_id: selectedSpecialtyId.value,
          doctor_id: doc.id,
          appointment_date: f.date,
          appointment_time: f.time,
          reason_for_visit: (f.reason_for_visit || '').trim()
        });
        if (data && data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reservation Submitted!',
            html: `Ref Code: <b>${esc(data.reference_code)}</b><br>Status: Pending confirmation.`,
            ...swalDark
          });
          bookingForms.value[doc.id] = { date: '', time: '', reason_for_visit: '' };
          delete slotInfo.value[doc.id];
          await loadPublicAvailability();
          await loadData();
        } else if (data && data.message && /taken/i.test(data.message)) {
          await onDateChange(doc);
        }
      });
    };

    const cancelAppointment = async (id) => {
      const r = await Swal.fire({
        title: 'Cancel this appointment?',
        input: 'text',
        inputLabel: 'Cancellation Reason (Optional)',
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel',
        cancelButtonText: 'Cancel',
        ...swalDark
      });
      if (!r.isConfirmed) return;   // previously continued even after pressing Cancel

      await busy(async () => {
        const data = await api('backend/api/patient_actions.php', { action: 'cancel', appointment_id: id, reason: r.value });
        if (data.success) { toast('Appointment cancelled.'); await loadData(); }
      });
    };

    const loadDoctorTimeOptions = async (doctorId, date, selectId, selected = '') => {
      const select = document.getElementById(selectId);
      if (!select) return;
      const requestId = (timeSelectRequests[selectId] || 0) + 1;
      timeSelectRequests[selectId] = requestId;
      select.disabled = true;
      select.innerHTML = '<option value="">Loading scheduled times…</option>';
      if (!doctorId || !date) {
        select.innerHTML = '<option value="">Choose a doctor and date</option>';
        return;
      }
      const data = await api(`backend/api/get_booked_slots.php?doctor_id=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
      if (timeSelectRequests[selectId] !== requestId || !select.isConnected) return;
      if (!data || !data.success) {
        select.innerHTML = '<option value="">Could not load scheduled times</option>';
        return;
      }
      const slots = (data.blocked ? [] : (data.slots || []))
        .filter(time => !(data.taken || []).includes(time) || time === selected);
      select.innerHTML = slots.length
        ? `<option value="">Choose a time</option>${slots.map(time =>
          `<option value="${time}" ${time === selected ? 'selected' : ''}>${fmtTime(time)}</option>`).join('')}`
        : '<option value="">No available times for this doctor and date</option>';
      select.disabled = !slots.length;
    };

    const rescheduleAppointment = async (app) => {
      const { value: v } = await Swal.fire({
        title: 'Reschedule Appointment',
        html: `<input id="swal-rdate" type="date" min="${today}" value="${esc(app.appointment_date)}" class="swal2-input">
               <select id="swal-rtime" class="swal2-input"><option value="">Loading scheduled times…</option></select>`,
        focusConfirm: false,
        showCancelButton: true,
        didOpen: () => {
          const date = document.getElementById('swal-rdate');
          loadDoctorTimeOptions(app.doctor_id, date.value, 'swal-rtime', app.appointment_time);
          date.addEventListener('change', () => loadDoctorTimeOptions(app.doctor_id, date.value, 'swal-rtime'));
        },
        ...swalDark,
        preConfirm: () => {
          const d = document.getElementById('swal-rdate').value;
          const time = document.getElementById('swal-rtime').value;
          if (!d || d < today) { Swal.showValidationMessage('Select a valid date'); return false; }
          if (!time) { Swal.showValidationMessage('Choose an available time.'); return false; }
          return [d, time];
        }
      });
      if (!v) return;

      await busy(async () => {
        const data = await api('backend/api/patient_actions.php', { action: 'reschedule', appointment_id: app.id, new_date: v[0], new_time: v[1] });
        if (data.success) { toast('Rescheduled. The doctor and Coordinator have been notified.'); await loadData(); }
      });
    };

    // ---------- Doctor ----------
    const doctorDecision = async (id, action) => {
      let reason = null;
      if (action === 'decline') {
        const r = await Swal.fire({
          input: 'textarea',
          inputLabel: 'Decline Reason (optional)',
          inputPlaceholder: 'Write the reason here...',
          showCancelButton: true,
          ...swalDark
        });
        if (!r.isConfirmed) return;
        reason = r.value;
      }
      await busy(async () => {
        const data = await api('backend/api/doctor_action.php', { appointment_id: id, action, reason });
        if (data.success) {
          toast(action === 'accept'
            ? 'Appointment accepted. The Coordinator will confirm it with the patient.'
            : 'Appointment declined. The Coordinator has been notified for reassignment.');
          await loadData();
        }
      });
    };

    const setFollowupAdvice = async (id) => {
      const { value: v } = await Swal.fire({
        title: 'Follow-Up Advice',
        html: '<input id="swal-input1" class="swal2-input" placeholder="Timeframe (e.g. Within 1 month)">' +
              '<textarea id="swal-input2" class="swal2-textarea" placeholder="Notes / Instructions for the Patient"></textarea>',
        focusConfirm: false,
        showCancelButton: true,
        ...swalDark,
        preConfirm: () => {
          const t = document.getElementById('swal-input1').value.trim();
          if (!t) { Swal.showValidationMessage('Enter the timeframe'); return false; }
          return [t, document.getElementById('swal-input2').value.trim()];
        }
      });
      if (!v) return;

      await busy(async () => {
        const data = await api('backend/api/doctor_action.php', { action: 'followup', appointment_id: id, followup_period: v[0], followup_notes: v[1] });
        if (data.success) { toast('Follow-up advice sent to the patient and Coordinator.'); await loadData(); }
      });
    };

    const fileLeave = async () => {
      const r = await Swal.fire({
        title: 'Leave / Emergency Blockout',
        html: `<select id="swal-ltype" class="swal2-input">
                 <option value="Emergency">🚨 Emergency (blocked immediately)</option>
                 <option value="Planned">🗓️ Planned: seminar/vacation (needs approval)</option>
               </select>
               <div style="font-size:11px;text-align:left;margin:8px 20px 0;opacity:.7">Start</div>
               <input id="swal-lstart" type="date" min="${today}" value="${today}" class="swal2-input" style="margin-top:2px">
               <div style="font-size:11px;text-align:left;margin:8px 20px 0;opacity:.7">Until (leave blank for a single day)</div>
               <input id="swal-lend" type="date" min="${today}" class="swal2-input" style="margin-top:2px">
               <input id="swal-lreason" class="swal2-input" placeholder="Reason (optional)">`,
        focusConfirm: false,
        showCancelButton: true,
        ...swalDark,
        preConfirm: () => {
          const start = document.getElementById('swal-lstart').value;
          const end = document.getElementById('swal-lend').value || start;
          if (!start || start < today) { Swal.showValidationMessage('Select a valid start date'); return false; }
          if (end < start) { Swal.showValidationMessage('The end date cannot be earlier than the start date'); return false; }
          return {
            leave_type: document.getElementById('swal-ltype').value,
            start_date: start,
            end_date: end,
            reason: document.getElementById('swal-lreason').value.trim()
          };
        }
      });
      if (!r.isConfirmed || !r.value) return;

      await busy(async () => {
        // doctor_id comes from the server session
        const data = await api('backend/api/doctor_leave.php', r.value);
        if (!data.success) return;
        if (data.type === 'Emergency') {
          Swal.fire({
            icon: 'warning',
            title: 'Emergency Blockout Recorded!',
            text: `${data.affected_appointments || 0} appointment(s) sent to the Care Coordinator for reassignment.`,
            ...swalDark
          });
        } else {
          toast('Leave request sent to the Coordinator.');
        }
        await loadData();
      });
    };

    // ---------- Coordinator ----------
    const forwardToDoctor = async (app) => {
      const r = await Swal.fire({
        title: 'Forward to the doctor?',
        text: `${app.patient_name} → ${app.doctor_name}`,
        input: 'textarea',
        inputLabel: 'Note for the doctor (optional)',
        inputPlaceholder: 'e.g. has asthma, first visit, etc.',
        showCancelButton: true,
        confirmButtonText: 'Yes, forward',
        cancelButtonText: 'Cancel',
        ...swalDark
      });
      if (!r.isConfirmed) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', { action: 'forward', appointment_id: app.id, note: r.value || '' });
        if (data.success) {
          const lg = (data.doctor_logins || []).join(', ');
          toast(`Forwarded to ${app.doctor_name}` + (lg ? ` (login: ${lg})` : ''));
          await loadData();
        }
      });
    };

    const checkInPatient = async (app) => {
      if (app.appointment_date !== today) {
        const r = await Swal.fire({ title: 'This is not the appointment date', text: `It is scheduled for ${app.appointment_date}. Check in anyway?`,
          showCancelButton: true, confirmButtonText: 'Yes, check in', cancelButtonText: 'Cancel', ...swalDark });
        if (!r.isConfirmed) return;
      }
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', { action: 'checkin', appointment_id: app.id });
        if (data.success) { toast('Checked in. The doctor has been notified.'); await loadData(); }
      });
    };

    const doctorComplete = async (app) => {
      const r = await Swal.fire({ title: 'Consultation finished?', text: `${app.patient_name} (${app.reference_code})`,
        showCancelButton: true, confirmButtonText: 'Yes, done', cancelButtonText: 'Cancel', ...swalDark });
      if (!r.isConfirmed) return;
      await busy(async () => {
        const data = await api('backend/api/doctor_action.php', { appointment_id: app.id, action: 'complete' });
        if (data.success) {
          await loadData();
          const f = await Swal.fire({title:'Consultation completed',text:'Would you like to add follow-up advice for this patient now?',icon:'success',showCancelButton:true,confirmButtonText:'Add Follow-up Advice',cancelButtonText:'Not now',...swalDark});
          if (f.isConfirmed) await setFollowupAdvice(app.id);
          else { navPage.value='followups'; toast('Saved. You can add follow-up advice later from Follow-up Advice.'); }
        }
      });
    };

    const respondFollowup = async (app, accept) => {
      const r = await Swal.fire({
        title: accept ? 'Confirm the follow-up?' : 'Decline the follow-up?',
        text: `${app.doctor_name} - ${app.appointment_date} @ ${fmtTime(app.appointment_time)}`,
        showCancelButton: true, confirmButtonText: accept ? 'Confirm' : 'Decline', cancelButtonText: 'Back', ...swalDark
      });
      if (!r.isConfirmed) return;
      await busy(async () => {
        const data = await api('backend/api/patient_actions.php', { action: accept ? 'confirm_followup' : 'decline_followup', appointment_id: app.id });
        if (data.success) { toast(accept ? 'Your follow-up is confirmed.' : 'The coordinator has been informed.'); await loadData(); }
      });
    };

    const relayToPatient = async (app) => {
      const r = await Swal.fire({
        title: app.status === 'Proposed' ? 'Send Follow-up Schedule to Patient?' : 'Send Appointment Confirmation to Patient?',
        text: app.status === 'Proposed'
          ? `The proposed follow-up (${app.appointment_date}) will be sent to ${app.patient_name} for confirmation.`
          : `This will notify ${app.patient_name} that ${app.reference_code} is Booked.`,
        showCancelButton: true,
        confirmButtonText: 'Send to Patient',
        cancelButtonText: 'Cancel',
        ...swalDark
      });
      if (!r.isConfirmed) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', { action: 'relay', appointment_id: app.id });
        if (data.success) { toast(app.status === 'Proposed' ? 'Follow-up schedule sent to the patient.' : 'Appointment confirmation sent to the patient.'); await loadData(); }
      });
    };

    const scheduleFollowup = async (app) => {
      const sameSpec = doctors.value.filter(d => d.specialty_id == app.specialty_id);
      const options = sameSpec.length ? sameSpec : doctors.value;
      let docId = app.doctor_id;
      let weekOf = today;
      const lbl = 'font-size:11px;text-align:left;margin:8px 20px 0;opacity:.7';
      while (true) {
        const r = await Swal.fire({
          title: 'Schedule Follow-up',
          html: `<div style="font-size:12px;text-align:left;margin:0 20px;opacity:.85">Doctor advice: <b>${esc(app.followup_timeframe)}</b><br>${esc(app.followup_notes || '')}</div>
                 <div style="${lbl}">Doctor (same specialty)</div>
                 <select id="swal-fdoc" class="swal2-input" style="margin-top:2px">${options.map(d => `<option value="${d.id}" ${d.id == docId ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
                 <div style="${lbl}">Target week (any day in that week)</div>
                 <input id="swal-fweek" type="date" min="${today}" value="${esc(weekOf)}" class="swal2-input" style="margin-top:2px">`,
          showCancelButton: true,
          confirmButtonText: 'Find Available Slots',
          focusConfirm: false,
          ...swalDark,
          preConfirm: () => {
            const w = document.getElementById('swal-fweek').value;
            if (!w) { Swal.showValidationMessage('Select a date'); return false; }
            return { doc: document.getElementById('swal-fdoc').value, week: w };
          }
        });
        if (!r.isConfirmed || !r.value) return;
        docId = r.value.doc;
        weekOf = r.value.week;

        const res = await api(`backend/api/get_followup_slots.php?doctor_id=${docId}&week_of=${weekOf}`);
        if (!res.success) return;
        if (!res.slots.length) {
          // Worst case: on leave / week is full -> choose another doctor or week
          await Swal.fire({
            icon: 'info',
            title: 'No available slots',
            text: 'The doctor is on leave or fully booked that week. Choose another doctor (same specialty) or another week.',
            ...swalDark
          });
          continue;
        }
        const pick = await Swal.fire({
          title: 'Select a Slot',
          input: 'select',
          inputOptions: Object.fromEntries(res.slots.map((sl, i) => [i + 1, sl.label])),
          inputPlaceholder: 'Select...',
          inputValidator: v => (!v || Number(v) < 1) && 'Select a slot.',
          showCancelButton: true,
          confirmButtonText: 'Propose',
          cancelButtonText: 'Back',
          ...swalDark
        });
        if (!pick.isConfirmed) continue;
        const slot = res.slots[Number(pick.value) - 1];
        let done = false;
        await busy(async () => {
          const out = await api('backend/api/coordinator_actions.php', {
            action: 'schedule_followup', appointment_id: app.id, doctor_id: docId, new_date: slot.date, new_time: slot.time
          });
          if (out.success) { toast(out.message || 'Follow-up proposed.'); await loadData(); done = true; }
        });
        if (done) return;
      }
    };

    const editWorkSchedule = async (doc) => {
      const r = await Swal.fire({
        title: `Workdays & Worktime: ${esc(doc.name)}`,
        html: `${workScheduleEditor(doc.workdays, doc.work_schedule)}<div style="font-size:11px;opacity:.7;margin-top:10px">Appointments outside the new schedule will need reassignment.</div>`,
        showCancelButton: true,
        ...swalDark,
        preConfirm: () => {
          return readWorkScheduleEditor();
        }
      });
      if (!r.isConfirmed || !r.value) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', {
          action: 'set_work_schedule', doctor_id: doc.id, ...r.value
        });
        if (data.success) {
          toast(`Updated. ${data.affected_appointments || 0} appointment(s) need to be reassigned.`);
          await loadData();
        }
      });
    };

    const createDoctorAccount = async () => {
      const specialtyOptions = specialties.value
        .map(specialty => `<option value="${esc(specialty.id)}">${esc(specialty.name)}</option>`)
        .join('');
      const defaultDays = [1, 2, 3, 4, 5];
      const result = await Swal.fire({
        title: 'Create doctor account',
        html: `<p class="doctor-account-help">Create a doctor profile with a secure sign-in, workdays, and worktime.</p>
          <label class="swal-label" for="swal-doctor-name">Doctor name</label>
          <input id="swal-doctor-name" class="swal2-input" maxlength="100" placeholder="e.g. Dr. Elena Mercado">
          <label class="swal-label" for="swal-doctor-username">Username</label>
          <input id="swal-doctor-username" class="swal2-input" maxlength="50" autocomplete="off" placeholder="e.g. dr.mercado">
          <label class="swal-label" for="swal-doctor-password">Initial password (8+ characters)</label>
          <input id="swal-doctor-password" type="password" class="swal2-input" minlength="8" maxlength="72" autocomplete="new-password">
          <label class="swal-label" for="swal-doctor-specialty">Specialty</label>
          <select id="swal-doctor-specialty" class="swal2-input">${specialtyOptions}</select>
          <span class="swal-label">Weekly workdays & worktime</span>
          ${workScheduleEditor(defaultDays)}`,
        showCancelButton: true,
        confirmButtonText: 'Create account',
        focusConfirm: false,
        ...swalDark,
        preConfirm: () => {
          const name = document.getElementById('swal-doctor-name').value.trim();
          const username = document.getElementById('swal-doctor-username').value.trim();
          const password = document.getElementById('swal-doctor-password').value;
          const specialtyId = document.getElementById('swal-doctor-specialty').value;
          const cleanName = name.replace(/^Dr\.?\s*/i, '').trim();
          if (!/^[\p{L}\p{M}][\p{L}\p{M}.'’ -]{2,97}$/u.test(cleanName)) {
            Swal.showValidationMessage('Enter a valid doctor name with at least 3 letters.');
            return false;
          }
          if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
            Swal.showValidationMessage('Username must be 3–50 characters using letters, numbers, dots, underscores, or hyphens.');
            return false;
          }
          if (password.length < 8) {
            Swal.showValidationMessage('Initial password must be at least 8 characters.');
            return false;
          }
          if (password.length > 72) {
            Swal.showValidationMessage('Initial password must be 72 characters or fewer.');
            return false;
          }
          if (!specialtyId) {
            Swal.showValidationMessage('Choose a specialty.');
            return false;
          }
          const selectedSchedule = readWorkScheduleEditor();
          if (!selectedSchedule) return false;
          return { name, username, password, specialty_id: Number(specialtyId), ...selectedSchedule };
        }
      });
      if (!result.isConfirmed || !result.value) return;

      let createdDoctor = null;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', {
          action: 'create_doctor_account', ...result.value
        });
        if (!data || !data.success) return;
        await loadData();
        createdDoctor = data;
      });
      if (!createdDoctor) return;

      const username = esc(createdDoctor.account.username);
      await Swal.fire({
        icon: 'success',
        title: 'Doctor account created',
        html: `<p><b>${esc(createdDoctor.doctor.name)}</b> and the doctor sign-in are ready.</p>
          <p style="margin-top:12px">Username: <code>${username}</code></p>
          <p style="margin-top:12px;font-size:12px;opacity:.75">Share the initial password securely with the doctor.</p>`,
        confirmButtonText: 'Done',
        ...swalDark
      });
    };

    const addCommitment = async (doc) => {
      const lbl = 'font-size:11px;text-align:left;margin:8px 20px 0;opacity:.7';
      const r = await Swal.fire({
        title: `Commitment: ${esc(doc.name)}`,
        html: `<div style="${lbl}">Start</div>
               <input id="swal-cstart" type="date" min="${today}" value="${today}" class="swal2-input" style="margin-top:2px">
               <div style="${lbl}">Until (leave blank for a single day)</div>
               <input id="swal-cend" type="date" min="${today}" class="swal2-input" style="margin-top:2px">
               <input id="swal-creason" class="swal2-input" placeholder="What is the commitment? (e.g. outreach, meeting)">`,
        showCancelButton: true,
        focusConfirm: false,
        ...swalDark,
        preConfirm: () => {
          const start = document.getElementById('swal-cstart').value;
          const end = document.getElementById('swal-cend').value || start;
          if (!start || start < today) { Swal.showValidationMessage('Select a valid start date'); return false; }
          if (end < start) { Swal.showValidationMessage('The end date cannot be earlier than the start date'); return false; }
          return { start_date: start, end_date: end, reason: document.getElementById('swal-creason').value.trim() };
        }
      });
      if (!r.isConfirmed || !r.value) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', { action: 'add_commitment', doctor_id: doc.id, ...r.value });
        if (data.success) {
          toast(`Blocked. ${data.affected_appointments || 0} appointment(s) need to be reassigned.`);
          await loadData();
        }
      });
    };

    const removeBlockout = async (b) => {
      const r = await Swal.fire({
        title: 'Reopen this date?',
        text: `${b.block_date} (${b.type})`,
        showCancelButton: true,
        confirmButtonText: 'Reopen',
        cancelButtonText: 'Cancel',
        ...swalDark
      });
      if (!r.isConfirmed) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', { action: 'remove_blockout', blockout_id: b.id });
        if (data.success) { toast('Date reopened.'); await loadData(); }
      });
    };

    const decideLeave = async (l, decision) => {
      const approve = decision === 'approve';
      const r = await Swal.fire({
        title: approve ? 'Approve this leave?' : 'Reject this leave?',
        text: approve
          ? `${l.doctor_name}: ${l.start_date} → ${l.end_date}. Affected appointments will be marked for reassignment.`
          : `${l.doctor_name}: ${l.start_date} → ${l.end_date}`,
        showCancelButton: true,
        confirmButtonText: approve ? 'Approve' : 'Reject',
        cancelButtonText: 'Back',
        ...swalDark
      });
      if (!r.isConfirmed) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', { action: 'leave_decision', leave_id: l.id, decision });
        if (data.success) {
          toast(approve ? `Approved. ${data.affected_appointments || 0} appointment(s) need to be reassigned.` : 'Request rejected.');
          await loadData();
        }
      });
    };

    const doctorOptions = (selectedId = null, specialtyId = null) => doctors.value
      .slice()
      .sort((a, b) => (b.specialty_id == specialtyId) - (a.specialty_id == specialtyId) || a.name.localeCompare(b.name))
      .map(d => `<option value="${d.id}" ${d.id == selectedId ? 'selected' : ''}>${esc(d.name)} — ${esc(d.specialty_name)}</option>`)
      .join('');

    const reassignApp = async (app) => {
      let suggestions = [];
      try {
        const response = await fetch('backend/api/reassignment_suggestions.php?appointment_id=' + encodeURIComponent(app.id), {credentials:'same-origin'});
        const result = await response.json();
        if (result.success && Array.isArray(result.suggestions)) suggestions = result.suggestions;
      } catch (err) { console.warn('Suggestions unavailable; manual reassignment remains available.', err); }
      const eligible = doctors.value.filter(d => String(d.specialty_id) === String(app.specialty_id) && d.status !== 'Inactive');
      if (!eligible.length) return Swal.fire({icon:'info',title:'No matching doctors',text:'No active doctors are available in this specialty. Review the doctor directory first.',...swalDark});
      const options = eligible.map(d => `<option value="${d.id}">${esc(d.name)} — ${esc(d.specialty_name)}</option>`).join('');
      const suggestionsHtml = suggestions.length ? `<div style="text-align:left;margin:12px 0 4px"><label style="font-size:12px;color:#93c5fd">Recommended available appointments (earliest first)</label><select id="swal-suggestion" class="swal2-select" style="width:100%;margin:7px 0 0"><option value="">Choose a recommendation or select manually</option>${suggestions.map((x,i)=>`<option value="${i}">${esc(x.doctor_name)} — ${esc(x.date)} at ${esc(x.time.slice(0,5))}</option>`).join('')}</select></div>` : '<p style="font-size:12px;color:#a1a1aa">No suggested slots in the next 30 days. Choose a doctor and date manually.</p>';
      const { value: v } = await Swal.fire({
        title: `Reassign: ${esc(app.patient_name)}`,
        html: `${suggestionsHtml}<label style="display:block;text-align:left;margin-top:10px;font-size:12px">Doctor (same specialty)</label><select id="swal-doc" class="swal2-input">${options}</select>
               <input id="swal-date" type="date" min="${today}" value="${app.appointment_date >= today ? esc(app.appointment_date) : ''}" class="swal2-input">
               <select id="swal-time" class="swal2-input"><option value="">Choose a doctor and date</option></select>`,
        focusConfirm: false, showCancelButton: true, confirmButtonText:'Confirm reassignment',
        didOpen: () => {
          const doctor = document.getElementById('swal-doc');
          const date = document.getElementById('swal-date');
          const update = async (preferredTime = '') => { await loadDoctorTimeOptions(doctor.value, date.value, 'swal-time'); if(preferredTime)document.getElementById('swal-time').value=preferredTime; };
          doctor.addEventListener('change', () => update()); date.addEventListener('change', () => update());
          const recommended = document.getElementById('swal-suggestion');
          if(recommended)recommended.addEventListener('change', async () => { if(recommended.value==='')return; const slot=suggestions[Number(recommended.value)]; doctor.value=String(slot.doctor_id); date.value=slot.date; await update(slot.time.slice(0,5)); });
          update();
        },
        ...swalDark,
        preConfirm: () => {
          const d = document.getElementById('swal-date').value;
          const time = document.getElementById('swal-time').value;
          if (!d || d < today) { Swal.showValidationMessage('Select a valid date'); return false; }
          if (!time) { Swal.showValidationMessage('Choose an available time.'); return false; }
          return [document.getElementById('swal-doc').value, d, time];
        }
      });
      if (!v) return;
      await busy(async () => {
        const data = await api('backend/api/coordinator_actions.php', {
          action: 'reassign', appointment_id: app.id, new_doctor_id: v[0], new_date: v[1], new_time: v[2]
        });
        if (data.success) { toast('Appointment reassigned successfully.'); await loadData(); }
      });
    };

    const openWalkinModal = async () => {
      const { value: v } = await Swal.fire({
        title: 'Walk-In Registration',
        html: `<input id="swal-wname" class="swal2-input" placeholder="Patient Name">
               <input id="swal-wphone" class="swal2-input" placeholder="Contact Number">
               <select id="swal-wdoc" class="swal2-input">${doctorOptions()}</select>
               <input id="swal-wdate" type="date" min="${today}" value="${today}" class="swal2-input">
               <select id="swal-wtime" class="swal2-input"><option value="">Loading scheduled times…</option></select>`,
        focusConfirm: false,
        showCancelButton: true,
        didOpen: () => {
          const doctor = document.getElementById('swal-wdoc');
          const date = document.getElementById('swal-wdate');
          const update = () => loadDoctorTimeOptions(doctor.value, date.value, 'swal-wtime');
          doctor.addEventListener('change', update);
          date.addEventListener('change', update);
          update();
        },
        ...swalDark,
        preConfirm: () => {
          const name = document.getElementById('swal-wname').value.trim();
          const date = document.getElementById('swal-wdate').value;
          if (!name) { Swal.showValidationMessage('Enter the patient name'); return false; }
          if (!date || date < today) { Swal.showValidationMessage('Select a valid date'); return false; }
          const time = document.getElementById('swal-wtime').value;
          if (!time) { Swal.showValidationMessage('Choose an available time.'); return false; }
          return {
            patient_name: name,
            contact_number: document.getElementById('swal-wphone').value.trim(),
            doctor_id: document.getElementById('swal-wdoc').value,
            appointment_date: date,
            appointment_time: time
          };
        }
      });
      if (!v) return;

      await busy(async () => {
        const data = await api('backend/api/book.php', { ...v, booked_by_role: 'coordinator' });
        if (data && data.success) {
          Swal.fire({ icon: 'success', title: 'Walk-in Booked!', html: `Ref Code: <b>${esc(data.reference_code)}</b>`, ...swalDark });
          await loadData();
        }
      });
    };



    // ---------- Guest appointment + OTP verification ----------
    const openGuestClaim = async () => {
      if (!currentUser.value || activeRole.value !== 'patient') return;
      const entry = await Swal.fire({
        title:'Link a previous guest appointment',
        html:`<div class="guest-mini-copy">Use the tracking code and the same name, phone and email used for the guest booking. We will send a fresh email code to confirm ownership.</div>
          <label class="guest-field-label">Tracking code</label><input id="claim-ref" class="swal2-input guest-swal-input" placeholder="REF-XXXXXXXX">
          <label class="guest-field-label">Full name on booking</label><input id="claim-name" class="swal2-input guest-swal-input" placeholder="Full name">
          <label class="guest-field-label">Mobile number</label><input id="claim-phone" class="swal2-input guest-swal-input" placeholder="09XXXXXXXXX">
          <label class="guest-field-label">Email used for booking</label><input id="claim-email" type="email" class="swal2-input guest-swal-input" placeholder="Email">`,
        showCancelButton:true,confirmButtonText:'Send verification code',...swalDark,
        preConfirm:()=>{
          const reference_code=document.getElementById('claim-ref').value.trim().toUpperCase();
          const full_name=document.getElementById('claim-name').value.trim();
          const contact_number=document.getElementById('claim-phone').value.trim();
          const email=document.getElementById('claim-email').value.trim().toLowerCase();
          if(!/^REF-[A-F0-9]{8}$/.test(reference_code)||!full_name||!/^09\d{9}$/.test(contact_number)||!email.includes('@')){Swal.showValidationMessage('Enter all four booking details.');return false;}
          return {reference_code,full_name,contact_number,email};
        }
      });
      if(!entry.isConfirmed) return;
      const p=entry.value;
      const sent=await api('backend/api/guest_send_otp.php',{full_name:p.full_name,contact_number:p.contact_number,email:p.email,channel:'email'},{silent:true});
      if(!sent||!sent.success){await Swal.fire({icon:'error',title:'Email could not be sent',text:(sent&&sent.message)||'Try again later.',...swalDark});return;}
      const code=await Swal.fire({title:'Verify booking email',text:'Enter the 6-digit code sent to your email.',input:'text',inputAttributes:{inputmode:'numeric',maxlength:6},showCancelButton:true,confirmButtonText:'Verify and link',...swalDark,inputValidator:v=>/^\d{6}$/.test(v)?undefined:'Enter a valid 6-digit code.'});
      if(!code.isConfirmed) return;
      const check=await api('backend/api/guest_verify_otp.php',{token:sent.token,code:code.value},{silent:true});
      if(!check||!check.success){await Swal.fire({icon:'error',title:'Verification failed',text:(check&&check.message)||'Try again.',...swalDark});return;}
      const linked=await api('backend/api/claim_guest.php',{...p,verification_token:check.verification_token},{silent:true});
      await Swal.fire({icon:linked&&linked.success?'success':'error',title:linked&&linked.success?'Appointment linked':'Could not link appointment',text:(linked&&linked.message)||'Please contact the coordinator.',...swalDark});
      if(linked&&linked.success) await loadData();
    };

    const openGuestTracker = async () => {
      const result = await Swal.fire({
        title: 'Track your appointment',
        html: `<div class="guest-mini-copy">Enter the Tracking Code you received after sending your request.</div>
          <label class="guest-field-label">Tracking Code</label><input id="guest-track-ref" class="swal2-input guest-swal-input" placeholder="REF-XXXXXXXX" autocomplete="off">
          <label class="guest-field-label">Mobile Number</label><input id="guest-track-phone" class="swal2-input guest-swal-input" placeholder="09XXXXXXXXX" inputmode="numeric" autocomplete="tel">`,
        confirmButtonText: 'Check status', showCancelButton: true, cancelButtonText: 'Close', ...swalDark,
        preConfirm: () => {
          const ref = document.getElementById('guest-track-ref').value.trim().toUpperCase();
          const contact = document.getElementById('guest-track-phone').value.trim();
          if (!ref || !/^09\d{9}$/.test(contact)) { Swal.showValidationMessage('Enter your tracking code and 11-digit mobile number.'); return false; }
          return { ref, contact };
        }
      });
      if (!result.isConfirmed) return;
      const data = await api(`backend/api/lookup.php?ref=${encodeURIComponent(result.value.ref)}&contact=${encodeURIComponent(result.value.contact)}`, null, { silent: true });
      if (!data || !data.success || !data.appointment) {
        await Swal.fire({ icon:'error', title:'Appointment not found', text:(data && data.message) || 'Check your tracking code and mobile number.', ...swalDark });
        return;
      }
      const a = data.appointment;
      const canCancel = ['Pending', 'Booked'].includes(a.status);
      const statusResult = await Swal.fire({
        icon:'info', title:'Appointment status',
        html:`<div class="guest-status-card"><span>${esc(a.reference_code || result.value.ref)}</span><h3>${esc(statusLabel(a.status || 'Pending'))}</h3><p><b>${esc(a.doctor_name || 'Assigned doctor')}</b><br>${esc(a.specialty_name || '')}</p><p>${esc(a.appointment_date || '')} · ${esc(fmtTime(a.appointment_time || ''))}</p>${a.followup_timeframe && String(a.followup_timeframe).trim() ? `<p>Follow-up advice: ${esc(a.followup_timeframe)}</p>` : ''}${canCancel ? '<p>To change your time, cancel this appointment and request a new one.</p>' : ''}</div>`,
        confirmButtonText:'Done', showDenyButton:canCancel, denyButtonText:'Cancel appointment', denyButtonColor:'#991b1b', ...swalDark
      });
      if (!statusResult.isDenied) return;

      const confirmation = await Swal.fire({
        icon:'warning', title:'Cancel appointment?',
        text:`This cannot be undone. Cancel appointment ${a.reference_code || result.value.ref}?`,
        confirmButtonText:'Yes, cancel it', confirmButtonColor:'#991b1b',
        showCancelButton:true, cancelButtonText:'Keep appointment', ...swalDark
      });
      if (!confirmation.isConfirmed) return;

      const cancelled = await api('backend/api/guest_cancel.php', {
        reference_code: result.value.ref,
        contact_number: result.value.contact,
        confirm: true
      }, { silent: true });
      if (cancelled && cancelled.success) {
        await Swal.fire({
          icon:'success', title:'Appointment cancelled',
          text:cancelled.message || 'Your appointment has been cancelled.',
          timer:1800, showConfirmButton:false, ...swalDark
        });
        return;
      }
      await Swal.fire({
        icon:'error', title:'Could not cancel appointment',
        text:(cancelled && cancelled.message) || 'Please try again later.',
        ...swalDark
      });
    };

    const openGuestBooking = async (preferredDoctorId = null) => {
      if (!specialties.value.length || !doctors.value.length) await loadPublicOverview();
      if (!publicAvailabilityLoaded.value) await loadPublicAvailability();

      const personal = await Swal.fire({
        title: 'Request an Appointment',
        html: `<div class="guest-stepper"><span class="active">1</span><i></i><span>2</span><i></i><span>3</span></div>
          <div class="guest-mini-copy"><b>No account required.</b> Enter your contact details so the clinic can identify your request and contact you about appointment updates.</div>
          <div class="guest-form-grid"><div class="guest-full"><label class="guest-field-label">Full name *</label><input id="g-name" class="swal2-input guest-swal-input" placeholder="Juan Dela Cruz" autocomplete="name"></div>
          <div><label class="guest-field-label">Mobile number *</label><input id="g-phone" class="swal2-input guest-swal-input" placeholder="09XXXXXXXXX" inputmode="numeric" maxlength="11" autocomplete="tel"></div>
          <div><label class="guest-field-label">Email <small>optional</small></label><input id="g-email" type="email" class="swal2-input guest-swal-input" placeholder="name@email.com" autocomplete="email"></div></div>
          <div class="guest-security-note">Mobile number is required. Email is optional. If provided, you must verify it with a one-time code.</div>`,
        confirmButtonText:'Continue', showCancelButton:true, cancelButtonText:'Cancel', width:680, ...swalDark,
        preConfirm:()=>{
          const full_name=document.getElementById('g-name').value.trim().replace(/\s+/g,' ');
          const contact_number=document.getElementById('g-phone').value.trim();
          const email=document.getElementById('g-email').value.trim().toLowerCase();
          if(full_name.length<4){Swal.showValidationMessage('Enter the patient full name.');return false;}
          if(!/^09\d{9}$/.test(contact_number)){Swal.showValidationMessage('Enter a valid 11-digit Philippine mobile number.');return false;}
          if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){Swal.showValidationMessage('Enter a valid email address or leave it blank.');return false;}
          return {full_name,contact_number,email};
        }
      });
      if(!personal.isConfirmed) return;
      const p=personal.value;

      // Email verification is required whenever an email is supplied.
      // Guests without email may still request a visit while SMS is unavailable.
      let verification_token = '';
      if (p.email) {
        const sent = await api('backend/api/guest_send_otp.php',
          {...p, channel:'email'}, {silent:true});
        if (!sent || !sent.success) {
          await Swal.fire({icon:'error', title:'Email verification unavailable',
            text:(sent && sent.message) || 'Unable to send the verification code.',
            ...swalDark});
          return;
        }
        let verified = false;
        while (!verified) {
          const entry = await Swal.fire({
            title:'Verify your email',
            html:`<div class="guest-mini-copy">We sent a 6-digit code to <b>${esc(p.email)}</b>. It expires in 5 minutes.</div>
              <label class="guest-field-label">Verification code</label>
              <input id="g-otp" class="swal2-input guest-swal-input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000">`,
            confirmButtonText:'Verify email', showCancelButton:true, cancelButtonText:'Cancel',
            showDenyButton:true, denyButtonText:'Resend code', ...swalDark,
            preConfirm:()=>{
              const code=document.getElementById('g-otp').value.trim();
              if(!/^\d{6}$/.test(code)){Swal.showValidationMessage('Enter the 6-digit code.');return false;}
              return code;
            }
          });
          if (entry.isDismissed) return;
          if (entry.isDenied) {
            const again=await api('backend/api/guest_send_otp.php',
              {...p,channel:'email'}, {silent:true});
            if (!again || !again.success) {
              await Swal.fire({icon:'error',title:'Cannot resend code',
                text:(again&&again.message)||'Try again later.',...swalDark});
              return;
            }
            sent.token=again.token;
            continue;
          }
          const check=await api('backend/api/guest_verify_otp.php',
            {token:sent.token,code:entry.value},{silent:true});
          if(check && check.success){
            verification_token=check.verification_token;
            verified=true;
          } else {
            await Swal.fire({icon:'error',title:'Verification failed',
              text:(check&&check.message)||'Please try again.',...swalDark});
          }
        }
      }

      const guestComplaints = complaintChoices.value.map((c,i)=>`<option value="${i}">${esc(c.label)}</option>`).join('');
      const specOptions=specialties.value.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
      const doctorOptionsHtml=doctors.value.map(d=>`<option value="${d.id}" data-specialty="${d.specialty_id}">${esc(d.name)} — ${esc(d.specialty_name)}</option>`).join('');
      const details = await Swal.fire({
        title:'Choose your visit',
        html:`<div class="guest-stepper"><span>✓</span><i class="done"></i><span>✓</span><i class="done"></i><span class="active">3</span></div>
          <div class="guest-mini-copy">This is a guide only, not medical advice. Your information is used only for your appointment.</div><div class="guest-full"><label class="guest-field-label">What do you need today?</label><select id="g-complaint" class="swal2-select guest-swal-select"><option value="">Choose a concern (optional)</option>${guestComplaints}</select><p id="g-suggestion" class="guest-mini-copy"></p></div><div class="guest-form-grid"><div><label class="guest-field-label">Specialty *</label><select id="g-spec" class="swal2-select guest-swal-select"><option value="">Choose specialty</option>${specOptions}</select></div>
          <div><label class="guest-field-label">Doctor *</label><select id="g-doc" class="swal2-select guest-swal-select"><option value="">Choose doctor</option>${doctorOptionsHtml}</select></div>
          <div><label class="guest-field-label">Available date *</label><select id="g-date" class="swal2-select guest-swal-select"><option value="">Choose doctor first</option></select></div>
          <div><label class="guest-field-label">Available time *</label><select id="g-time" class="swal2-select guest-swal-select"><option value="">Choose date first</option></select></div>
          <div class="guest-full"><label class="guest-field-label">Reason for visit <small>optional</small></label><textarea id="g-reason" class="swal2-textarea guest-swal-textarea" maxlength="500" placeholder="Briefly describe the reason for your appointment"></textarea></div></div>`,
        confirmButtonText:'Submit appointment request', showCancelButton:true, cancelButtonText:'Cancel', width:760, ...swalDark,
        didOpen:()=>{
          const sp=document.getElementById('g-spec'), doc=document.getElementById('g-doc'), date=document.getElementById('g-date'), time=document.getElementById('g-time');
          const filterDoctors=()=>{const sid=sp.value; [...doc.options].forEach((o,i)=>{if(i===0)return;o.hidden=!!sid&&o.dataset.specialty!==sid;}); if(doc.selectedOptions[0]&&doc.selectedOptions[0].hidden)doc.value=''; fillDates();};
          const fillDates=()=>{ const rows=publicAvailability.value[doc.value]||[]; date.innerHTML='<option value="">Choose date</option>'+rows.map(x=>`<option value="${x.date}">${x.label} — ${x.slots.length} open</option>`).join(''); time.innerHTML='<option value="">Choose date first</option>'; };
          const fillTimes=()=>{ const rows=publicAvailability.value[doc.value]||[]; const row=rows.find(x=>x.date===date.value); time.innerHTML='<option value="">Choose time</option>'+((row&&row.slots)||[]).map(x=>`<option value="${x.value}">${x.label}</option>`).join(''); };
          const complaintSelect=document.getElementById('g-complaint');
          complaintSelect.addEventListener('change',async()=>{
            const item=complaintChoices.value[Number(complaintSelect.value)];
            if (complaintSelect.value==='' || !item) return;
            const match=specialties.value.find(s=>s.name.toLowerCase()===item.specialty.toLowerCase());
            if(!match) return;
            sp.value=String(match.id); doc.value=''; date.value=''; time.value='';
            document.getElementById('g-reason').value=item.label;
            document.getElementById('g-suggestion').textContent='Suggested specialty: '+match.name+(item.unsure?' — A general doctor can assess you and refer you if needed.':'')+' You may choose another specialty.';
            filterDoctors();
            if(item.emergency) await Swal.fire({icon:'warning',title:'Emergency warning',text:'If this is an emergency, go to the nearest hospital or call 911 immediately.',...swalDark});
          });
          sp.addEventListener('change',()=>{if(complaintSelect.value!=='')document.getElementById('g-suggestion').textContent='You can choose a different specialty. This is a guide only.';filterDoctors();}); doc.addEventListener('change',()=>{ const selected=doctors.value.find(x=>String(x.id)===String(doc.value)); if(selected)sp.value=String(selected.specialty_id); fillDates();}); date.addEventListener('change',fillTimes);
          if(preferredDoctorId){ doc.value=String(preferredDoctorId); doc.dispatchEvent(new Event('change')); }
        },
        preConfirm:()=>{
          const doctor_id=document.getElementById('g-doc').value, appointment_date=document.getElementById('g-date').value, appointment_time=document.getElementById('g-time').value;
          if(!doctor_id||!appointment_date||!appointment_time){Swal.showValidationMessage('Choose a specialty, doctor, date, and time.');return false;}
          return {doctor_id:Number(doctor_id),appointment_date,appointment_time,reason_for_visit:document.getElementById('g-reason').value.trim()};
        }
      });
      if(!details.isConfirmed) return;
      const booked=await api('backend/api/guest_book.php',{...p,...details.value,verification_token},{silent:true});
      if(!booked||!booked.success){ await Swal.fire({icon:'error',title:'Request not submitted',text:(booked&&booked.message)||'Please try again.',...swalDark}); return; }
      const done=await Swal.fire({
        icon:'success', title:'Request sent!',
        html:`<div class="guest-success"><span>YOUR TRACKING CODE</span><strong>${esc(booked.reference_code)}</strong><p>Save this code. Your request is <b>not yet confirmed</b> until the clinic reviews it.</p></div><div class="guest-mini-copy">You can create an optional patient account. After logging in, use "Link Guest Appointment" to securely attach this request to your history.</div>`,
        confirmButtonText:'Done', showDenyButton:true, denyButtonText:'Create optional account', ...swalDark
      });
      await loadPublicAvailability();
      if(done.isDenied){ registerForm.value.contact_number=p.contact_number; const names=p.full_name.split(' '); registerForm.value.first_name=names.shift()||''; registerForm.value.last_name=names.join(' ')||''; authMode.value='register'; showAuth.value=true; }
    };

    onMounted(() => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dm-compact', compactMode.value);
        document.documentElement.classList.toggle('dm-light', lightMode.value);
        document.title = `${publicPageTitles[publicPage.value]} | Klinika Consulta`;
      }
      if (typeof window !== 'undefined') window.addEventListener('popstate', syncPublicPage);
      checkSession();
    });

    return {
      TIME_SLOTS, today,
      currentUser, activeRole, navPage, sidebarOpen, toggleSidebar, publicPage, navigatePublic, isLoading, loginForm, authMode, showAuth, registerForm, handleRegister, forgotPassword, verifyRegistrationEmail, linkWalkinCoordinator, openGuestBooking, openGuestTracker, openGuestClaim,
      specialties, doctors, publicAvailability, publicAvailabilityLoaded, publicAvailabilityFailed, appointments, hasActiveAppointment, notifications, unreadNotifs, showNotifs,
      selectedSpecialtyId, chosenComplaint, complaintChoices, chooseComplaint, selectComplaint, chooseSpecialtyManually, bookingForms, slotInfo, search, statusFilter,
      filteredDoctors, doctorApps, followupAppointments, filteredAppointments, statusCounts, activeAppointments, historyAppointments, todayQueue, todayPendingRequests, completionRate, specialtyReport, downloadDoctorSchedule,
      fmtTime, statusLabel, statusClass, canModify, appointmentNextStep, doctorYears, doctorFocus, isTaken, isSlotDisabled, canSubmit, onDateChange, availableDatesForDoctor, availableWeekdaysForDoctor, isBookingWeekdaySelected, selectAvailableWeekday, selectAvailableDate, openPatientBooking,
      handleLogin, handleLogout, openProfile, openSettings, toggleNotifDropdown, openDoctorRequests, canReviewNotification, submitReservation, compactMode, toggleCompactMode, lightMode, toggleLightMode, notifEnabled, toggleNotifPref, calendarMode, calendarDate, calendarItems, calendarTitle, moveCalendar, activityLogs, messageConversations, messages, selectedConversationId, messageDraft, unreadMessages, loadMessages, openConversation, selectedConversationTitle, sendMessage, bookWithDoctor, showAppointmentDetails, printAppointment,
      doctorDecision, setFollowupAdvice, reassignApp, cancelAppointment, createDoctorAccount,
      rescheduleAppointment, fileLeave, openWalkinModal,
      forwardToDoctor, decideLeave, stageText, leaves, pendingLeaves,
      relayToPatient, scheduleFollowup, checkInPatient, doctorComplete, editWorkSchedule, addCommitment, removeBlockout,
      schedule, showSchedule, workdayLabel, doctorScheduleLabel, hasCoordAction, myDoctor
    };
  }
};

const publicRevealDirective = {
  mounted(element) {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    element.classList.add('scroll-reveal-pending');
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      element.classList.remove('scroll-reveal-pending');
      element.classList.add('scroll-revealed');
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

    observer.observe(element);
  }
};

Vue.createApp(App)
  .directive('reveal', publicRevealDirective)
  .mount('#app');
