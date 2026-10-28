// Klinika Consulta - UI template (all screens). Rendered by the root component in app.js.
const APP_TEMPLATE = `
    <div class="min-h-screen flex flex-col bg-[#0a0a0c] text-zinc-100 font-mono text-sm border-t-2 border-blue-500 relative">
      
      <div v-if="currentUser" class="emergency-notice signed-in-emergency" role="note"><strong>Emergency?</strong> This booking system is not an emergency service. Call <strong>911</strong> in the Philippines or seek emergency care for life-threatening symptoms.</div>
      <!-- GLOBAL LOADING SPINNER -->
      <div v-if="isLoading" class="network-loading" role="status" aria-live="polite" aria-label="Loading Klinika Consulta">
        <div class="network-loading-card">
          <span class="network-loader" aria-hidden="true"></span>
          <strong>Connecting to Klinika Consulta</strong>
          <span class="network-loading-caption">Getting your clinic experience ready</span>
        </div>
      </div>

      <!-- PUBLIC PAGES -->
      <div v-if="!currentUser" class="public-site">
        <nav class="public-nav">
          <a href="?page=home" class="public-brand" @click.prevent="navigatePublic('home')" aria-label="Klinika Consulta home"><svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/></svg>Klinika <span>Consulta</span></a>
          <div id="public-menu-links" class="public-links" :class="{ 'is-open': mobileMenu }" aria-label="Main navigation" @click="mobileMenu = false">
            <a href="?page=home" @click.prevent="navigatePublic('home')" :class="{ active: publicPage === 'home' }" :aria-current="publicPage === 'home' ? 'page' : null">Home</a>
            <a href="?page=about" @click.prevent="navigatePublic('about')" :class="{ active: publicPage === 'about' }" :aria-current="publicPage === 'about' ? 'page' : null">About</a>
            <a href="?page=doctors" @click.prevent="navigatePublic('doctors')" :class="{ active: publicPage === 'doctors' }" :aria-current="publicPage === 'doctors' ? 'page' : null">Doctors</a>
            <a href="?page=how" @click.prevent="navigatePublic('how')" :class="{ active: publicPage === 'how' }" :aria-current="publicPage === 'how' ? 'page' : null">How it works</a>
            <a href="?page=contact" @click.prevent="navigatePublic('contact')" :class="{ active: publicPage === 'contact' }" :aria-current="publicPage === 'contact' ? 'page' : null">Contact us</a>
          </div>
          <div class="public-nav-actions"><button @click="openGuestTracker()" class="public-track-text">Track appointment</button><button @click="authMode='login'; showAuth=true" class="public-login">Log in</button><button type="button" class="public-menu-toggle" :aria-expanded="mobileMenu ? 'true' : 'false'" aria-controls="public-menu-links" @click="mobileMenu = !mobileMenu"><span class="sr-only">Menu</span><span aria-hidden="true">{{ mobileMenu ? '✕' : '☰' }}</span></button></div>
        </nav>

        <div class="emergency-notice" role="note"><strong>Medical emergency?</strong> This system is not for emergencies. Call <strong>911</strong> or go to the nearest emergency department.</div>
        <main class="public-page">
          <section v-if="publicPage === 'home'" class="public-hero home-page">
            <div class="hero-copy"><h1>Care visits,<br><span>made simpler.</span></h1><p>Request an appointment in a few minutes. No account is needed for your first visit.</p><div class="hero-actions"><button @click="openGuestBooking()" class="hero-primary">Request an appointment</button><button @click="navigatePublic('how')" class="hero-text-link">How it works <span aria-hidden="true">→</span></button></div><p class="hero-privacy">Your details are used only for your appointment. Read our <a href="terms.html" target="_blank" rel="noopener">Terms and Privacy Notice</a>.</p><div class="hero-visit-types" aria-label="Specialties available"><span>Visit types:</span><b v-for="sp in specialties.slice(0, 4)" :key="sp.id">{{ sp.name }}</b></div></div>
            <div class="hero-panel"><div class="hero-clinic-photo"><img src="assets/clinic-care.svg?v=20261028-ui-r4" alt="A doctor reviewing a patient's care on a computer" fetchpriority="high"></div></div>
          </section>
          <section v-if="publicPage === 'home'" class="home-steps" aria-labelledby="home-steps-title"><div class="home-steps-head"><span class="section-kicker">How it works</span><h2 id="home-steps-title">Three steps to your visit</h2></div><ol class="home-steps-list"><li><span class="step-badge"><svg class="step-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 20.5c.8-3.6 3.5-5.8 7-5.8s6.2 2.2 7 5.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M10.2 14.6 12 17l1.8-2.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><button type="button" @click="navigatePublic('doctors')"><span class="step-no">Step 1</span><b>Choose a doctor</b><small>Pick a specialty and see clinic days.</small></button></li><li><span class="step-badge"><svg class="step-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8.5 15.2l2.3 2.3 4.7-4.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><button type="button" @click="openGuestBooking()"><span class="step-no">Step 2</span><b>Request a time</b><small>Send your request in a few minutes.</small></button></li><li><span class="step-badge"><svg class="step-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 12h4l2.5-5 4 10 2.5-5H21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><button type="button" @click="openGuestTracker()"><span class="step-no">Step 3</span><b>Track your visit</b><small>Use your tracking code for updates.</small></button></li></ol><p class="home-steps-more"><a href="?page=how" @click.prevent="navigatePublic('how')">See the full process →</a></p></section>

          <section v-if="publicPage === 'about'" class="public-section public-content-page">
            <header class="page-intro"><div class="section-kicker">About Klinika Consulta</div><h1>Appointment details, brought together.</h1><p>Klinika Consulta helps patients and clinic staff manage appointment requests, schedules, check-in, and follow-up in one place.</p></header>
            <div class="care-section about-feature" v-reveal><div class="care-photo"><img src="assets/clinic-consult.svg?v=20261028-r13" alt="A clinician talking with a patient during a consultation" loading="lazy"><div class="care-photo-caption"><span>HERE FOR YOUR HEALTH</span><strong>Thoughtful care, from the first visit onward.</strong></div></div><div class="care-copy"><div class="section-kicker">Care made easier</div><h2>One clear place for your next step.</h2><p>Patients can request a visit and check its status. Doctors can review appointments and share follow-up advice. Coordinators can organize schedules and help patients on the day of their visit.</p><p>Each role has the information it needs to keep care organized—from the first request to check-in and follow-up.</p><div class="about-points"><span>✓ Appointment status</span><span>✓ Doctor schedules</span><span>✓ Patient check-in</span><span>✓ Follow-up advice</span></div></div></div>
            <div class="about-role-grid" v-reveal><article><span>FOR PATIENTS</span><h2>Check your appointment status.</h2><p>Send a visit request without an account and track it with your secure tracking code. Returning patients can create an account for faster future bookings.</p></article><article><span>FOR DOCTORS</span><h2>Review your appointments.</h2><p>Check your schedule, manage availability, and share follow-up advice.</p></article><article><span>FOR COORDINATORS</span><h2>Coordinate the clinic day.</h2><p>Manage schedules, check-in, patient flow, and appointment changes.</p></article></div>
            <aside class="public-next-step" v-reveal><div><span>CARE, MADE CLEARER</span><h2>See how your visit comes together.</h2><p>Learn what happens after you send a request, from clinic review through check-in.</p></div><div><button @click="navigatePublic('how')" class="public-next-primary">See how it works <span aria-hidden="true">→</span></button><button @click="navigatePublic('doctors')" class="public-next-secondary">Meet the care team</button></div></aside>
          </section>

          <section v-if="publicPage === 'doctors'" class="public-section public-content-page">
            <header class="page-intro doctors-intro"><div class="section-kicker">Meet the care team</div><h1>Find a doctor for your next visit.</h1><p>Choose a specialty and open a doctor’s card to see clinic days and live open dates over the next 30 days.</p><div class="schedule-notice"><span aria-hidden="true">ⓘ</span> Open dates and 30-minute times update from the clinic schedule. A request is held while the clinic reviews it.</div></header>
            <div class="doctor-directory-layout">
              <aside class="specialty-quicklinks">
                <details class="specialty-picker">
                  <summary><span>Browse specialties</span><small>{{ specialties.length }} specialties</small><i aria-hidden="true">⌄</i></summary>
                  <nav aria-label="Doctor specialties">
                    <a v-for="specialty in specialties" :key="specialty.id" :href="'#specialty-' + specialty.id">{{ specialty.name }}<span aria-hidden="true">→</span></a>
                  </nav>
                </details>
              </aside>
              <div class="doctor-directory">
                <div class="directory-toolbar"><div><span class="directory-count">{{ doctors.length }}</span><span> doctors across {{ specialties.length }} specialties</span></div><button @click="downloadDoctorSchedule" class="schedule-download"><span aria-hidden="true">▦</span> Download schedule CSV</button></div>
                <section v-for="specialty in specialties" :key="specialty.id" :id="'specialty-' + specialty.id" class="specialty-group" v-reveal>
                  <header class="specialty-heading"><div><span class="section-kicker">Specialty</span><h2>{{ specialty.name }}</h2></div><p>{{ specialty.description || 'Explore doctors and their clinic schedules.' }}</p></header>
                  <div v-if="doctors.filter(doc => Number(doc.specialty_id) === Number(specialty.id)).length" class="doctor-accordion">
                    <details v-for="doc in doctors.filter(item => Number(item.specialty_id) === Number(specialty.id))" :key="doc.id" class="doctor-schedule-card">
                      <summary><span class="doctor-summary-avatar">{{ (doc.name || 'D').replace('Dr.','').trim().charAt(0) }}</span><span class="doctor-summary-main"><b>{{ doc.name }}</b><small>{{ specialty.name }}</small></span><span class="doctor-summary-days">{{ (doc.available_days || 'By schedule').replace(/,/g, ', ') }}</span><span class="accordion-chevron" aria-hidden="true">⌄</span></summary>
                      <div class="doctor-schedule-details">
                        <div class="schedule-detail-heading"><div><span>DOCTOR'S WEEKLY HOURS</span><b>{{ doctorScheduleLabel(doc) }}</b></div></div>
                        <p>Appointments last 30 minutes. The clinic is open 9:00 AM–12:00 PM and 1:30 PM–4:00 PM.</p>
                        <div class="public-availability">
                          <details class="public-availability-disclosure" open>
                            <summary class="public-availability-heading"><span>OPEN DATES</span><small>Next 30 days</small><i aria-hidden="true">⌄</i></summary>
                            <div v-if="!publicAvailabilityLoaded" class="public-availability-message">Checking the clinic schedule…</div>
                            <div v-else-if="publicAvailabilityFailed" class="public-availability-message is-error">Available dates could not be loaded. Please refresh the page to try again.</div>
                            <div v-else-if="publicAvailability[doc.id] && publicAvailability[doc.id].length" class="public-availability-dates">
                              <details v-for="date in publicAvailability[doc.id]" :key="date.date">
                                <summary><b>{{ date.label }}</b><span>{{ date.slots.length }} open {{ date.slots.length === 1 ? 'time' : 'times' }}</span><span class="public-availability-chevron" aria-hidden="true">⌄</span></summary>
                                <div class="public-availability-times"><span v-for="slot in date.slots" :key="slot.value">{{ slot.label }}</span></div>
                              </details>
                            </div>
                            <div v-else class="public-availability-message">No open appointment times in the next 30 days.</div>
                          </details>
                        </div>
                        <button @click="openGuestBooking(doc.id)" class="doctor-request-button">Request an appointment <span aria-hidden="true">→</span></button>
                      </div>
                    </details>
                  </div>
                  <div v-else class="specialty-empty">No doctors are currently listed for this specialty.</div>
                </section>
                <div v-if="specialties.length === 0 && !isLoading" class="empty-doctors"><b>Doctor information is not available right now.</b><p>Please try again in a moment or contact the clinic coordinator for help.</p></div>
              </div>
            </div>
            <aside class="public-next-step" v-reveal><div><span>FIND YOUR CARE TEAM</span><h2>Ready to choose a doctor?</h2><p>Browse specialties, clinic days, and open dates before sending your request.</p></div><div><button @click="openGuestBooking()" class="public-next-primary">Request an appointment <span aria-hidden="true">→</span></button><button @click="openGuestTracker()" class="public-next-secondary">Track an existing request</button></div></aside>
          </section>

          <section v-if="publicPage === 'how'" class="public-section public-content-page how-page">
            <header class="page-intro"><div class="section-kicker">Your visit, step by step</div><h1>Know what to expect at each step.</h1><p>Use Klinika Consulta to request an appointment and follow clinic updates. Your visit is confirmed only after the clinic reviews your request.</p></header>
            <div class="how-grid how-grid-four" v-reveal><article><b>01</b><h2>Request an appointment</h2><p>Fill out the quick request form with your basic details. No account is required.</p></article><article><b>02</b><h2>Choose a doctor and time</h2><p>Browse doctors by specialty, choose a date and standard appointment time, then send your request.</p></article><article><b>03</b><h2>Wait for clinic confirmation</h2><p>The clinic reviews your request and checks availability. Use your tracking code to check your status anytime.</p></article><article><b>04</b><h2>Check in for your visit</h2><p>When the clinic confirms your appointment, arrive for your visit and check in with the clinic team.</p></article></div>
            <aside class="how-note" v-reveal><span>IMPORTANT</span><p>Sending a request does not confirm an appointment. Save your Tracking Code and wait for the clinic’s confirmation before your visit.</p><button @click="openGuestTracker()" class="contact-button">Check appointment status →</button></aside>
            <aside class="public-next-step" v-reveal><div><span>START YOUR REQUEST</span><h2>Your next visit starts here.</h2><p>Choose a doctor and a time that works for you. The clinic will review your request.</p></div><div><button @click="openGuestBooking()" class="public-next-primary">Request an appointment <span aria-hidden="true">→</span></button><button @click="navigatePublic('doctors')" class="public-next-secondary">Browse doctors</button></div></aside>
          </section>

          <section v-if="publicPage === 'contact'" class="public-section public-content-page contact-section">
            <header class="page-intro"><div class="section-kicker">Contact Klinika Consulta</div><h1>How can we help you?</h1><p>Get in touch about using Klinika Consulta, or choose a quick option for a new or existing appointment. For clinic hours, directions, and in-person assistance, contact your clinic coordinator.</p></header>
            <div class="contact-channel-grid" v-reveal>
              <article class="contact-channel-card contact-channel-email"><span class="contact-channel-icon" aria-hidden="true">@</span><span class="contact-eyebrow">GENERAL QUESTIONS</span><h2>Email our team</h2><p>Send a question about the service or your appointment. Include your reference code if you have one, but never email passwords or verification codes.</p><a href="mailto:klinikaconsulta@gmail.com?subject=Klinika%20Consulta%20inquiry" class="contact-channel-link">klinikaconsulta@gmail.com <span aria-hidden="true">↗</span></a></article>
              <article class="contact-channel-card"><span class="contact-channel-icon" aria-hidden="true">#</span><span class="contact-eyebrow">EXISTING APPOINTMENT</span><h2>Check your status</h2><p>Use your tracking code and contact number to review updates to your appointment request.</p><button type="button" @click="openGuestTracker()" class="contact-channel-link">Open appointment tracker <span aria-hidden="true">→</span></button></article>
              <article class="contact-channel-card"><span class="contact-channel-icon" aria-hidden="true">＋</span><span class="contact-eyebrow">BOOKING A VISIT</span><h2>Request an appointment</h2><p>Browse specialties and doctors, then send a request. The clinic will review it before your visit is confirmed.</p><button type="button" @click="openGuestBooking()" class="contact-channel-link">Start a request <span aria-hidden="true">→</span></button></article>
            </div>
            <section class="contact-topics" v-reveal aria-labelledby="contact-topics-title">
              <div class="contact-section-heading"><span class="contact-eyebrow">QUICK GUIDANCE</span><h2 id="contact-topics-title">Choose the right place to start</h2><p>These quick steps can help you get an answer sooner.</p></div>
              <div class="contact-topic-grid">
                <article><span class="contact-topic-number">01</span><div><h3>Appointment updates</h3><p>For a pending request or a confirmed visit, open the tracker with your tracking code and contact number.</p><button type="button" @click="openGuestTracker()">Track an appointment <span aria-hidden="true">→</span></button></div></article>
                <article><span class="contact-topic-number">02</span><div><h3>Clinic-specific questions</h3><p>For clinic hours, directions, or in-person support, contact your clinic coordinator directly.</p><a href="mailto:klinikaconsulta@gmail.com?subject=Clinic%20information%20request">Email about clinic information <span aria-hidden="true">↗</span></a></div></article>
                <article><span class="contact-topic-number">03</span><div><h3>Changes to a visit</h3><p>Check the appointment tracker first. If the change you need is not available there, ask your clinic coordinator for help.</p><button type="button" @click="openGuestTracker()">View appointment options <span aria-hidden="true">→</span></button></div></article>
              </div>
            </section>
            <p class="contact-note"><strong>Need urgent medical care?</strong> Klinika Consulta is not an emergency service and email is not monitored for emergencies. Call 911 in the Philippines or go to the nearest emergency department for a life-threatening emergency.</p>
          </section>
        </main>
        
        <footer class="public-footer"><a href="?page=home" class="public-brand" @click.prevent="navigatePublic('home')"><svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/></svg>Klinika <span>Consulta</span></a><p>Clinic appointment & coordination system</p><div class="footer-links"><a href="?page=about" @click.prevent="navigatePublic('about')">About</a><a href="?page=doctors" @click.prevent="navigatePublic('doctors')">Doctors</a><a href="?page=how" @click.prevent="navigatePublic('how')">How it works</a><a href="?page=contact" @click.prevent="navigatePublic('contact')">Contact</a></div></footer>

        <div v-if="showAuth" class="auth-modal" @click.self="showAuth=false"><div class="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button type="button" class="auth-close" @click="showAuth=false" aria-label="Close login">×</button><section class="auth-welcome"><span class="auth-kicker">YOUR CLINIC, MORE CONNECTED</span><h2>Welcome<br>back.</h2><p>Sign in to keep your appointments, updates, and follow-up care together.</p><ul><li><b>01</b> Keep track of your appointments</li><li><b>02</b> Stay connected with your care team</li><li><b>03</b> Find your next step in one place</li></ul></section><section class="auth-panel"><div class="auth-brand-line"><span class="auth-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/></svg></span><p class="auth-brand">Klinika <span>Consulta</span></p></div><div class="auth-heading"><h1 id="auth-title">{{ authMode === 'login' ? 'Log in' : 'Create your account' }}</h1><p class="auth-subtitle">{{ authMode === 'login' ? 'Use your account username and password.' : 'Sign up for a patient account.' }}</p></div>
          <form v-if="authMode === 'login'" @submit.prevent="handleLogin" class="auth-form"><div><label class="form-label" for="login-username">Username</label><input id="login-username" type="text" v-model="loginForm.username" required autocomplete="username" placeholder="Enter your username" class="form-input"></div><div><label class="form-label" for="login-password">Password</label><input id="login-password" type="password" v-model="loginForm.password" required autocomplete="current-password" placeholder="Enter your password" class="form-input"></div><button type="submit" class="auth-submit">Log in →</button><p class="auth-forgot"><button type="button" @click="forgotPassword()">Forgot password?</button></p><p class="auth-signup"><span>New to Klinika Consulta? <button type="button" @click="authMode='register'">Sign up here</button></span></p><div class="login-demo"><b>Demo Accounts (Password: 123456):</b><span>• Patient: <strong class="demo-patient">patient1</strong></span><span>• Coordinator/Nurse: <strong class="demo-coordinator">coordinator1</strong></span><span>• Doctor: <strong class="demo-doctor">doctor1</strong> or <strong class="demo-doctor-alt">dr_&lt;surname&gt;</strong> (e.g. dr_cruz)</span></div></form>
          <form v-else @submit.prevent="handleRegister" class="auth-form auth-register-form"><div class="grid grid-cols-2 gap-2"><div><label class="form-label" for="register-first-name">First name</label><input id="register-first-name" type="text" v-model="registerForm.first_name" required minlength="2" maxlength="50" autocomplete="given-name" class="form-input"></div><div><label class="form-label" for="register-last-name">Last name</label><input id="register-last-name" type="text" v-model="registerForm.last_name" required minlength="2" maxlength="50" autocomplete="family-name" class="form-input"></div></div><div><label class="form-label" for="register-contact">Contact number</label><input id="register-contact" type="tel" v-model="registerForm.contact_number" required minlength="11" maxlength="11" pattern="09[0-9]{9}" inputmode="numeric" autocomplete="tel" title="Invalid number." class="form-input"></div><div><label class="form-label" for="register-email">Email for verification and recovery *</label><div style="display:flex;gap:8px;align-items:stretch"><input id="register-email" type="email" required v-model="registerForm.email" @input="registerForm.email_verification_token=''" class="form-input" placeholder="you@example.com" style="flex:1;min-width:0"><button type="button" @click="verifyRegistrationEmail()" :disabled="!registerForm.email || !!registerForm.email_verification_token" :style="{background:registerForm.email_verification_token?'#065f46':'#2563eb',opacity:!registerForm.email?0.55:1}" style="border:1px solid #3b82f6;color:white;border-radius:9px;padding:0 12px;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer;min-height:44px">{{registerForm.email_verification_token ? 'Verified ✓' : 'Verify Email'}}</button></div><small v-if="registerForm.email_verification_token" style="color:#34d399;display:block;margin-top:6px">✓ Email verified successfully</small></div><div><label class="form-label" for="register-username">Username</label><input id="register-username" type="text" v-model="registerForm.username" required class="form-input"></div><div class="grid grid-cols-2 gap-2"><div><label class="form-label" for="register-password">Password</label><input id="register-password" type="password" v-model="registerForm.password" required minlength="8" class="form-input"></div><div><label class="form-label" for="register-confirm">Confirm password</label><input id="register-confirm" type="password" v-model="registerForm.confirm" required minlength="8" class="form-input"></div></div><label class="terms-consent" style="display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.4;margin:4px 0"><input type="checkbox" v-model="registerForm.terms" required style="margin-top:2px"><span>I have read and agree to the <a href="terms.html" target="_blank" rel="noopener" style="text-decoration:underline">Terms and Conditions</a> and the handling of my personal data.</span></label><button type="submit" class="auth-submit register" :disabled="!registerForm.terms">Create patient account</button><p class="auth-switch">Already registered? <button type="button" @click="authMode='login'">Log in</button></p></form>
        </section></div></div>
      </div>

      <!-- MAIN APP DASHBOARD (Kapag nakalogin) -->
      <div v-else class="flex-1 flex flex-col" :class="'account-role-' + activeRole">
        
        <!-- Top Navigation -->
        <header class="workspace-header border-b border-zinc-800 px-4 sm:px-6 py-3 bg-[#0d0d11]">
          <div class="workspace-header-inner">
            <div class="workspace-brand">
              <button type="button" class="sidebar-toggle" :class="{ 'is-open': sidebarOpen }" @click="toggleSidebar" :aria-expanded="sidebarOpen" aria-controls="workspace-sidebar" :aria-label="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'" :title="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"><span class="sidebar-toggle-icon" aria-hidden="true"><i></i><i></i><i></i></span></button>
              <a href="#dashboard" class="workspace-brand-link" @click.prevent="navPage='dashboard'" aria-label="Klinika Consulta dashboard"><svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/></svg><h1>Klinika <span>Consulta</span></h1></a>
            </div>

            <div class="flex items-center gap-4">
              <!-- Notification Bell -->
              <div class="relative">
                <button type="button" @click="toggleNotifDropdown" class="notification-trigger" :class="{ 'has-unread': unreadNotifs > 0 }" :aria-label="'Notifications' + (unreadNotifs > 0 ? ', ' + unreadNotifs + ' unread' : '')" :aria-expanded="showNotifs" aria-haspopup="true" title="Notifications">
                  <svg class="notification-bell-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span v-if="unreadNotifs > 0" class="notification-count" aria-hidden="true">
                    {{ unreadNotifs > 99 ? '99+' : unreadNotifs }}
                  </span>
                </button>

                <div v-if="showNotifs" class="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 bg-[#121216] border border-zinc-800 rounded-xl shadow-2xl p-3 z-50 space-y-2">
                  <div class="flex justify-between items-center border-b border-zinc-800 pb-2 text-xs">
                    <span class="font-bold text-zinc-200">Notifications ({{ activeRole }})</span>
                    <span class="text-[10px] text-zinc-500">{{ notifications.length }} total</span>
                  </div>
                  <div v-if="notifications.length === 0" class="text-xs text-zinc-500 py-4 text-center">No new notifications.</div>
                  <div class="max-h-60 overflow-y-auto space-y-2">
                    <div v-for="n in notifications" :key="n.id" class="p-2 bg-zinc-900/80 rounded border border-zinc-800 text-[11px] space-y-0.5">
                      <div class="font-bold text-blue-400">{{ n.title }}</div>
                      <div class="text-zinc-300 leading-snug">{{ n.message }}</div>
                      <div class="text-[9px] text-zinc-600">{{ n.created_at }}</div>
                      <button v-if="canReviewNotification(n)" @click="openDoctorRequests" class="mt-1 text-blue-400 hover:text-blue-300 font-bold">Review appointment requests →</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- User Profile & Logout -->
              <div class="text-right border-l border-zinc-800 pl-4">
                <div class="workspace-user-name">{{ currentUser.full_name }}</div>
                <div class="workspace-user-role">{{ activeRole }}</div>
              </div>

              <button @click="handleLogout" class="px-3 py-1.5 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-800 rounded-lg text-xs transition">
                Logout
              </button>
            </div>
          </div>
        </header>

        <!-- Main Content Area -->
        <div class="app-layout max-w-7xl mx-auto w-full flex-1" :class="sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'">
          <aside id="workspace-sidebar" class="dm-sidebar">
            <div class="sidebar-role">{{ activeRole }} workspace</div>
            <button @click="navPage='dashboard'" :class="['side-link', navPage==='dashboard' ? 'active' : '']">⌂ <span>Dashboard</span></button>
            <button v-if="activeRole === 'patient'" @click="openPatientBooking" :class="['side-link side-book', navPage==='booking' ? 'active' : '']">＋ <span>Book Appointment</span></button>
            <button v-if="activeRole === 'patient'" @click="navPage='appointments'" :class="['side-link', navPage==='appointments' ? 'active' : '']">▣ <span>My Appointments</span></button>
            <button v-if="activeRole === 'patient'" @click="navPage='history'" :class="['side-link', navPage==='history' ? 'active' : '']">◴ <span>Appointment History</span></button>
            <button v-if="activeRole === 'patient'" @click="navPage='followups'" :class="['side-link', navPage==='followups' ? 'active' : '']">↻ <span>Follow-ups</span></button>
            <button v-if="activeRole === 'patient'" @click="navPage='directory'" :class="['side-link', navPage==='directory' ? 'active' : '']">✚ <span>Doctors</span></button>
            <button v-if="activeRole === 'coordinator'" @click="navPage='appointments'" :class="['side-link', navPage==='appointments' ? 'active' : '']">▤ <span>Appointments</span></button>
            <button v-if="activeRole === 'coordinator'" @click="navPage='queue'" :class="['side-link', navPage==='queue' ? 'active' : '']">◷ <span>Patient Queue</span></button>
            <button v-if="activeRole === 'coordinator'" @click="navPage='schedule'" :class="['side-link', navPage==='schedule' ? 'active' : '']">▦ <span>Doctor Schedules</span></button>
            <button v-if="activeRole === 'coordinator'" @click="navPage='calendar'" :class="['side-link', navPage==='calendar' ? 'active' : '']">▦ <span>Clinic Calendar</span></button>
            <button v-if="activeRole === 'coordinator'" @click="navPage='activity'" :class="['side-link', navPage==='activity' ? 'active' : '']">↻ <span>Activity Log</span></button>
            <button v-if="activeRole === 'coordinator'" @click="navPage='reports'" :class="['side-link', navPage==='reports' ? 'active' : '']">⌁ <span>Reports & Analytics</span></button>
            <button v-if="activeRole === 'doctor'" @click="navPage='appointments'" :class="['side-link', navPage==='appointments' ? 'active' : '']">▤ <span>My Appointments</span></button>
            <button v-if="activeRole === 'doctor'" @click="navPage='schedule'" :class="['side-link', navPage==='schedule' ? 'active' : '']">▦ <span>Schedule & Leave</span></button>
            <button v-if="activeRole === 'doctor'" @click="navPage='calendar'" :class="['side-link', navPage==='calendar' ? 'active' : '']">▦ <span>Calendar</span></button>
            <button v-if="activeRole === 'doctor'" @click="navPage='followups'" :class="['side-link', navPage==='followups' ? 'active' : '']">↻ <span>Follow-up Advice</span></button>
            <button v-if="activeRole === 'doctor'" @click="navPage='history'" :class="['side-link', navPage==='history' ? 'active' : '']">◴ <span>Consultation History</span></button>
            <button v-if="['patient','doctor'].includes(activeRole)" @click="navPage='messages'; loadMessages()" :class="['side-link', navPage==='messages' ? 'active' : '']">✉ <span>Messages</span><em v-if="unreadMessages">{{ unreadMessages }}</em></button>
            <button @click="navPage='notifications'" :class="['side-link', navPage==='notifications' ? 'active' : '']">♢ <span>Notifications</span><em v-if="unreadNotifs && notifEnabled">{{ unreadNotifs }}</em></button>
            <div class="sidebar-divider"></div>
            <button @click="navPage='profile'" :class="['side-link', navPage==='profile' ? 'active' : '']">◎ <span>Profile</span></button>
            <button @click="navPage='settings'" :class="['side-link', navPage==='settings' ? 'active' : '']">⚙ <span>Settings</span></button>
          </aside>
          <main id="dashboard" :key="activeRole + '-' + navPage" class="dm-main px-4 sm:px-6 py-6" :class="'workspace-' + activeRole">

          <!-- STANDALONE SIDEBAR PAGES -->
          <section v-if="navPage==='messages' && ['patient','doctor'].includes(activeRole)" class="standalone-page"><div class="page-head"><div class="section-kicker">Secure Clinic Chat</div><h2>Messages</h2><p>Message your assigned doctor or patient about an appointment without sharing personal phone numbers.</p></div><div class="message-layout"><div class="page-card message-conversations"><h3>Conversations</h3><div v-if="messageConversations.length===0" class="empty-state">No appointment conversations yet. Messaging becomes available for your booked appointments.</div><button v-for="c in messageConversations" :key="c.appointment_id" @click="openConversation(c)" :class="['conversation-item', selectedConversationId==c.appointment_id?'active':'']"><div><b>{{ activeRole==='patient' ? c.doctor_name : c.patient_name }}</b><small>{{ c.reference_code }} · {{ c.appointment_date }}</small></div><em v-if="Number(c.unread_count)">{{ c.unread_count }}</em></button></div><div class="page-card chat-panel"><div v-if="!selectedConversationId" class="empty-state">Select a conversation to start messaging.</div><template v-else><div class="chat-head"><div><b>{{ selectedConversationTitle }}</b><small>Appointment-related messages only</small></div><button @click="loadMessages(selectedConversationId)" class="page-secondary">Refresh</button></div><div class="chat-body"><div v-if="messages.length===0" class="empty-state">No messages yet. You can start the conversation below.</div><div v-for="m in messages" :key="m.id" :class="['chat-message', Number(m.sender_user_id)===Number(currentUser.id)?'mine':'theirs']"><b>{{ Number(m.sender_user_id)===Number(currentUser.id) ? 'You' : m.sender_name }}</b><p>{{ m.message }}</p><small>{{ m.created_at }}</small></div></div><form class="chat-compose" @submit.prevent="sendMessage"><textarea v-model="messageDraft" maxlength="1000" rows="2" placeholder="Type an appointment-related message..." required></textarea><button class="page-primary" :disabled="!messageDraft.trim()">Send</button></form><p class="chat-note">For emergencies, contact the clinic or emergency services directly. Klinika Consulta chat is not for urgent medical care.</p></template></div></div></section>

          <section v-if="navPage==='notifications'" class="standalone-page"><div class="page-head"><div class="section-kicker">Inbox</div><h2>Notifications</h2><p>Appointment updates, clinic actions, follow-ups, and schedule notices appear here.</p></div><div class="page-card"><div v-if="notifications.length===0" class="empty-state">No notifications yet.</div><div v-for="n in notifications" :key="n.id" class="notification-row"><div><b>{{ n.title || 'Klinika Consulta update' }}</b><p>{{ n.message }}</p><button v-if="canReviewNotification(n)" @click="openDoctorRequests" class="mt-2 text-blue-400 hover:text-blue-300 text-xs font-bold">Review appointment requests →</button></div><small>{{ n.created_at || '' }}</small></div></div></section>
          <section v-if="navPage==='profile'" class="standalone-page"><div class="page-head"><div class="section-kicker">Account</div><h2>My Profile</h2><p>Your personal Klinika Consulta account information and clinic activity.</p></div><div class="profile-grid"><div class="page-card profile-identity"><div class="profile-big-avatar">{{ currentUser.full_name.charAt(0) }}</div><h3>{{ currentUser.full_name }}</h3><span>{{ activeRole }}</span><button @click="openProfile" class="page-primary">Edit Profile Information</button></div><div class="page-card detail-list"><h3>Account Details</h3><div><span>Full name</span><b>{{ currentUser.full_name }}</b></div><div><span>Username</span><b>{{ currentUser.username }}</b></div><div><span>Role</span><b>{{ activeRole }}</b></div><div><span>Account status</span><b class="ok-text">Active</b></div></div><div class="page-card detail-list"><h3>Clinic Activity</h3><div><span>Total appointments</span><b>{{ appointments.length }}</b></div><div><span>Completed</span><b>{{ appointments.filter(a=>a.status==='Completed').length }}</b></div><div><span>Active / upcoming</span><b>{{ appointments.filter(a=>!['Completed','Cancelled'].includes(a.status)).length }}</b></div></div></div></section>
          <section v-if="navPage==='settings'" class="standalone-page"><div class="page-head"><div class="section-kicker">Preferences & Security</div><h2>Settings</h2><p>Control your account security, appearance, notifications, and workspace density.</p></div><div class="settings-grid"><div class="page-card setting-block"><div><h3>Password & Security</h3><p>Update your password regularly to keep your Klinika Consulta account protected.</p></div><button @click="openSettings" class="page-primary">Change Password</button></div><div class="page-card setting-block"><div><h3>Appearance</h3><p>Switch the entire workspace between high-contrast light and dark themes.</p></div><button @click="toggleLightMode" class="page-secondary">{{ lightMode ? 'Use Dark Mode' : 'Use Light Mode' }}</button></div><div class="page-card setting-block"><div><h3>Display Density</h3><p>Choose a comfortable layout or fit more clinic information on screen.</p></div><button @click="toggleCompactMode" class="page-secondary">{{ compactMode ? 'Use Comfortable View' : 'Use Compact View' }}</button></div><div class="page-card setting-block"><div><h3>Notification Indicators</h3><p>Show or mute unread badges while keeping all notifications available in the notification center.</p></div><button @click="toggleNotifPref" class="page-secondary">{{ notifEnabled ? 'Mute Indicators' : 'Enable Indicators' }}</button></div><div class="page-card setting-block"><div><h3>Session & Privacy</h3><p>Signed in as {{ currentUser.username }}. Log out when using a shared clinic computer.</p></div><button @click="handleLogout" class="danger-button">Log out securely</button></div></div></section>

          <section v-if="navPage==='calendar' && ['coordinator','doctor'].includes(activeRole)" class="standalone-page"><div class="page-head"><div class="section-kicker">Visual Schedule</div><h2>{{ activeRole==='doctor' ? 'My Clinic Calendar' : 'Clinic Calendar' }}</h2><p>Switch between day, week, and month views to review clinic appointments.</p></div><div class="page-card calendar-toolbar"><div><button v-for="m in ['day','week','month']" :key="m" @click="calendarMode=m" :aria-pressed="calendarMode===m" :class="calendarMode===m?'page-primary':'page-secondary'">{{ m }}</button></div><div><button type="button" @click="moveCalendar(-1)" :aria-label="calendarMode==='day' ? 'Previous day' : calendarMode==='week' ? 'Previous week' : 'Previous month'" class="page-secondary">←</button><input type="date" v-model="calendarDate" aria-label="Choose calendar date" class="calendar-date"><button type="button" @click="moveCalendar(1)" :aria-label="calendarMode==='day' ? 'Next day' : calendarMode==='week' ? 'Next week' : 'Next month'" class="page-secondary">→</button></div></div><div class="page-card calendar-results"><h3 class="report-title">{{ calendarTitle }}</h3><div v-if="calendarItems.length===0" class="empty-state">No appointments in this {{ calendarMode }} view.</div><div v-else class="calendar-groups-scroll"><details v-for="(group,index) in calendarGroups" :key="group.date" class="calendar-day-group" :open="index===0"><summary :aria-label="'Show appointments for ' + group.label"><strong>{{ group.label }}</strong><span>{{ group.items.length }} {{ group.items.length === 1 ? 'appointment' : 'appointments' }}</span><i aria-hidden="true">⌄</i></summary><div class="calendar-day-events"><div v-for="app in group.items" :key="app.id" class="calendar-event" @click="showAppointmentDetails(app)"><div><strong>{{ fmtTime(app.appointment_time) }} · {{ activeRole==='doctor' ? app.patient_name : app.doctor_name }}</strong><p>{{ app.specialty_name }} · {{ app.patient_name }}</p></div><span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span></div></div></details></div></div></section>

          <section v-if="activeRole==='coordinator' && navPage==='activity'" class="standalone-page"><div class="page-head"><div class="section-kicker">Audit Trail</div><h2>Activity Log</h2><p>Recent appointment actions recorded by Klinika Consulta for accountability and presentation.</p></div><div class="page-card"><div v-if="activityLogs.length===0" class="empty-state">No activity has been recorded yet. New actions will appear here.</div><div v-for="log in activityLogs" :key="log.id" class="activity-line"><span>{{ log.created_at }}</span><b>{{ log.full_name || log.role || 'System' }}</b><em>{{ (log.action || '').replaceAll('_',' ') }}</em><strong>{{ log.details || ('Appointment #'+(log.appointment_id||'—')) }}</strong></div></div></section>

          <section v-if="navPage==='followups' && ['patient','doctor'].includes(activeRole)" class="standalone-page"><div class="page-head"><div class="section-kicker">Continuity of Care</div><h2>{{ activeRole==='doctor' ? 'Follow-up Advice' : 'My Follow-ups' }}</h2><p>{{ activeRole==='doctor' ? 'Completed consultations stay here until follow-up advice is recorded. You can also review advice already sent.' : 'Review your doctor’s follow-up timeframe, instructions, and follow-up appointment status.' }}</p></div><div class="page-card"><div v-if="followupAppointments.length===0" class="empty-state">{{ activeRole==='doctor' ? 'No completed consultations are waiting for follow-up advice.' : 'No follow-up advice yet.' }}</div><div v-for="app in followupAppointments" :key="app.id" class="history-row"><div @click="showAppointmentDetails(app)" style="cursor:pointer"><b>{{ app.reference_code }}</b><h3>{{ activeRole==='doctor' ? app.patient_name : app.doctor_name }}</h3><p>{{ app.specialty_name }} · {{ app.appointment_date }} @ {{ fmtTime(app.appointment_time) }}</p><div v-if="app.followup_timeframe" class="followup-note"><strong>{{ app.followup_timeframe }}</strong><span>{{ app.followup_notes || 'No additional instructions.' }}</span></div><div v-else class="followup-pending">Follow-up advice has not been added yet.</div></div><div><span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span><button v-if="activeRole==='doctor' && app.status==='Completed' && !app.followup_timeframe" @click="setFollowupAdvice(app.id)" class="page-primary followup-action">Add Advice</button><small v-else>View details →</small></div></div></div></section>

          <section v-if="navPage==='history'" class="standalone-page"><div class="page-head"><div class="section-kicker">Records</div><h2>{{ activeRole==='doctor' ? 'Consultation History' : 'Appointment History' }}</h2><p>Review completed, cancelled, declined, and past clinic activity.</p></div><div class="page-card"><div v-if="activeRole==='patient'" class="page-card" style="margin-bottom:14px"><p>Booked before creating your account? Your guest booking is not linked automatically, even if your name and phone match.</p><button class="page-primary" @click="openGuestClaim">Link a previous guest appointment (email verification)</button></div><div v-if="historyAppointments.length===0" class="empty-state">No linked history records yet.</div><div v-for="app in historyAppointments" :key="app.id" class="history-row" @click="showAppointmentDetails(app)"><div><b>{{ app.reference_code }}</b><h3>{{ activeRole==='doctor' ? app.patient_name : app.doctor_name }}</h3><p>{{ app.specialty_name }} · {{ app.appointment_date }} @ {{ fmtTime(app.appointment_time) }}</p></div><div><span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span><small>View details →</small></div></div></div></section>

          <section v-if="activeRole==='patient' && navPage==='directory'" class="standalone-page"><div class="page-head"><div class="section-kicker">Care Team</div><h2>Doctor Directory</h2><p>Browse doctors by specialty and review their experience and schedule.</p></div><div class="directory-grid"><article v-for="doc in doctors" :key="doc.id" class="page-card directory-card"><div class="profile-big-avatar">{{ doc.name.replace('Dr.','').trim().charAt(0) }}</div><small>{{ doc.specialty_name }}</small><h3>{{ doc.name }}</h3><p>{{ doctorFocus(doc) }}</p><div class="detail-list"><div><span>Experience</span><b>{{ doctorYears(doc) }}+ years</b></div><div><span>Availability</span><b>{{ doc.available_days }}</b></div></div><button @click="bookWithDoctor(doc)" class="page-primary">Book with this doctor</button></article></div></section>

          <section v-if="activeRole==='coordinator' && navPage==='reports'" class="standalone-page"><div class="page-head"><div class="section-kicker">Clinic Insights</div><h2>Reports & Analytics</h2><p>Operational summary based on the appointments currently stored in Klinika Consulta.</p></div><div class="report-grid"><div class="metric-card"><span>Total Records</span><strong>{{ appointments.length }}</strong><small>all appointment records</small></div><div class="metric-card"><span>Completion Rate</span><strong>{{ completionRate }}%</strong><small>completed consultations</small></div><div class="metric-card"><span>Walk-ins</span><strong>{{ appointments.filter(a=>a.booked_by_role==='coordinator').length }}</strong><small>coordinator registrations</small></div><div class="metric-card"><span>Follow-ups</span><strong>{{ appointments.filter(a=>a.followup_timeframe).length }}</strong><small>with doctor advice</small></div></div><div class="page-card"><h3 class="report-title">Appointments by Specialty</h3><div v-for="r in specialtyReport" :key="r.name" class="report-bar"><div><span>{{ r.name }}</span><b>{{ r.count }}</b></div><div class="bar-track"><i :style="{width:r.percent+'%'}"></i></div></div></div><div class="page-card"><h3 class="report-title">Recent Clinic Activity</h3><div v-for="app in appointments.slice(0,8)" :key="app.id" class="activity-line" @click="showAppointmentDetails(app)"><span>{{ app.appointment_date }}</span><b>{{ app.patient_name }}</b><em>{{ app.doctor_name }}</em><strong>{{ statusLabel(app.status) }}</strong></div></div></section>

          <!-- 1. PATIENT VIEW -->
          <div v-if="activeRole === 'patient' && ['dashboard','booking','appointments'].includes(navPage)" :class="navPage==='dashboard' ? 'patient-dashboard space-y-6' : 'space-y-6'">
            <section v-if="navPage==='dashboard'" class="dashboard-welcome">
              <div class="dashboard-welcome-copy">
                <span class="dashboard-eyebrow">YOUR CARE, IN ONE PLACE</span>
                <h2>Welcome back,<br><strong>{{ currentUser.full_name }}</strong></h2>
                <p>Book your next visit, check appointment updates, and stay connected with your care team.</p>
                <div class="dashboard-welcome-actions">
                  <button @click="openPatientBooking" class="dashboard-primary-action">＋ Book an Appointment <span aria-hidden="true">→</span></button>
                  <button @click="navPage='appointments'" class="dashboard-secondary-action">View appointments</button>
                </div>
              </div>
              <div class="dashboard-welcome-note" aria-label="Your care journey">
                <span class="dashboard-note-mark" aria-hidden="true">✚</span>
                <span class="dashboard-note-label">KLINIKA CONSULTA</span>
                <strong>Care that stays connected.</strong>
                <p>Your appointment details and clinic updates, all in one place.</p>
              </div>
            </section>
 
            <div v-if="navPage==='dashboard'" class="dashboard-grid">
              <div class="metric-card metric-card-active"><span><i aria-hidden="true">01</i> Upcoming / Active</span><strong>{{ appointments.filter(a => !['Completed','Cancelled'].includes(a.status)).length }}</strong><small>appointments in progress</small></div>
              <div class="metric-card metric-card-confirmed"><span><i aria-hidden="true">02</i> Confirmed</span><strong>{{ appointments.filter(a => a.status === 'Booked').length }}</strong><small>ready for clinic visit</small></div>
              <div class="metric-card metric-card-followup"><span><i aria-hidden="true">03</i> Follow-ups</span><strong>{{ appointments.filter(a => a.followup_timeframe).length }}</strong><small>with doctor advice</small></div>
            </div>

            <!-- Specialty Selection -->
            <div v-if="navPage==='booking'" id="booking" class="booking-flow">
              <header class="booking-page-heading"><span>YOUR CARE, YOUR NEXT STEP</span><h2>Plan your visit</h2><p>Tell us what you need and find an appointment that works for you.</p></header>
              <section class="booking-step-card">
                <div class="booking-step-heading"><span>01</span><div><h3>What do you need today?</h3><p>Choose a concern for a suggestion, or select a specialty below.</p></div></div>
                <p class="booking-guidance">This is a guide only, not medical advice. Your information is used only for your appointment.</p>
                <div class="booking-select-wrap"><label for="complaint-select">Health concern <span>Optional</span></label><select id="complaint-select" class="booking-select" :value="chosenComplaint" @change="selectComplaint"><option value="">Choose a health concern...</option><option v-for="item in complaintChoices" :key="item.label" :value="item.label">{{ item.label }}</option></select></div>
                <p v-if="chosenComplaint" class="booking-suggestion"><span aria-hidden="true">✦</span><span>Suggested specialty: <strong>{{ specialties.find(s=>s.id==selectedSpecialtyId)?.name }}</strong><span v-if="chosenComplaint==='I don’t know what I need'"> — A general doctor can assess you and refer you if needed.</span></span></p>
              </section>
              <section class="booking-step-card">
                <div class="booking-step-heading"><span>02</span><div><h3>Choose a specialty</h3><p>Select the care team that best fits your visit.</p></div></div>
                <div class="booking-select-wrap"><label for="specialty-select">Specialty</label><select id="specialty-select" class="booking-select" :value="selectedSpecialtyId || ''" @change="chooseSpecialtyManually($event.target.value ? Number($event.target.value) : null)"><option value="">Choose a specialty...</option><option v-for="s in specialties" :key="s.id" :value="s.id">{{ s.name }}</option></select></div>
                <p v-if="selectedSpecialtyId" class="booking-select-description">{{ specialties.find(s=>s.id==selectedSpecialtyId)?.description }}</p>
              </section>
              <div v-if="hasActiveAppointment" class="booking-active-notice">
                You already have an active appointment. Complete or cancel it before booking another schedule.
                <button @click="navPage='appointments'" class="ml-1 font-bold underline">View your appointment</button>
              </div>
            </div>

            <!-- Doctor Booking Options -->
            <div v-if="navPage==='booking' && selectedSpecialtyId && !filteredDoctors.length" class="booking-empty-doctors">No doctors are available for this specialty yet. Try General Medicine or choose another specialty.</div><div v-if="navPage==='booking' && selectedSpecialtyId && filteredDoctors.length" class="doctor-booking-grid">
              <div v-for="doc in filteredDoctors" :key="doc.id" class="doctor-booking-card">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="doctor-card-kicker">YOUR CARE TEAM</span>
                    <h4 class="doctor-card-name">{{ doc.name }}</h4>
                    <span class="doctor-card-room">{{ doc.room_number }}</span><p class="doctor-card-focus">{{ doctorFocus(doc) }}</p>
                  </div>
                  <span class="doctor-duty-badge">Clinic days · {{ doc.available_days }}</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="booking-date-picker">
                    <div class="booking-available-dates">
                      <div class="booking-available-heading"><b>Available days</b><span>Select a day</span></div>
                      <div v-if="!publicAvailabilityLoaded" class="booking-date-message">Checking the clinic schedule…</div>
                      <div v-else-if="publicAvailabilityFailed" class="booking-date-message is-error">Could not load available dates. Please try again shortly.</div>
                      <div v-else-if="availableWeekdaysForDoctor(doc.id).length" class="booking-weekday-list">
                        <button v-for="day in availableWeekdaysForDoctor(doc.id)" :key="day.index" type="button"
                          @click="selectAvailableWeekday(doc, day.index)"
                          :class="['booking-weekday-option', isBookingWeekdaySelected(doc.id, day.index) ? 'is-selected' : '']"
                          :aria-pressed="isBookingWeekdaySelected(doc.id, day.index)">
                          {{ day.name }}
                        </button>
                      </div>
                      <div v-else class="booking-date-message">No available days with open appointment times in the next 30 days.</div>
                    </div>
                    <label class="text-[10px] text-zinc-500 block mb-1">Appointment date *</label>
                    <input type="date" :min="today" v-model="bookingForms[doc.id].date" @change="onDateChange(doc)" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-blue-500">
                    <span class="booking-date-hint">Choosing a day selects its next open date. You can also pick an exact date here.</span>
                  </div>
                  <div class="booking-time-picker">
                    <div class="booking-time-heading"><label>Choose a 30-minute time *</label><span>Doctor's scheduled hours</span></div>
                    <div v-if="slotInfo[doc.id] && slotInfo[doc.id].loading" class="booking-slot-message">Checking the latest availability…</div>
                    <div v-else-if="slotInfo[doc.id] && slotInfo[doc.id].failed" class="booking-slot-message is-error">Could not load availability. Choose the date again to retry.</div>
                    <div v-else-if="slotInfo[doc.id] && slotInfo[doc.id].blocked" class="booking-slot-message is-error">This doctor does not work on that date or is unavailable.</div>
                    <div v-else-if="!bookingForms[doc.id].date" class="booking-slot-message">Choose a date to see open appointment times.</div>
                    <div v-else-if="slotInfo[doc.id] && !slotInfo[doc.id].slots.length" class="booking-slot-message">No work hours are scheduled for this date.</div>
                    <div v-else class="booking-slot-grid">
                      <button v-for="t in slotInfo[doc.id].slots" :key="t" type="button"
                        @click="bookingForms[doc.id].time = t"
                        :disabled="isSlotDisabled(doc.id, t)"
                        :title="hasActiveAppointment ? 'Complete or cancel your active appointment before booking again' : ''"
                        :aria-pressed="bookingForms[doc.id].time === t"
                        :class="['booking-slot', bookingForms[doc.id].time === t ? 'is-selected' : '', isTaken(doc.id, t) ? 'is-taken' : '']">
                        <span>{{ fmtTime(t) }}</span><small v-if="isTaken(doc.id, t)">Booked</small>
                      </button>
                    </div>
                    <div v-if="bookingForms[doc.id].date && slotInfo[doc.id] && !slotInfo[doc.id].loading && !slotInfo[doc.id].failed && !slotInfo[doc.id].blocked && slotInfo[doc.id].slots.length && slotInfo[doc.id].slots.every(time => slotInfo[doc.id].taken.includes(time))" class="booking-slot-message">No appointment times remain for this date. Please choose another day.</div>
                  </div>
                </div>
                <div>
                  <label class="text-[10px] text-zinc-500 block mb-1">Reason for Visit</label>
                  <textarea v-model="bookingForms[doc.id].reason_for_visit" maxlength="500" rows="2" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-blue-500" placeholder="Briefly describe the reason for your appointment"></textarea>
                </div>
                <button
                  @click="submitReservation(doc)"
                  :disabled="!canSubmit(doc)"
                  :class="['w-full font-bold py-2 rounded text-xs transition', !canSubmit(doc) ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white']"
                >
                  {{ hasActiveAppointment ? 'Active appointment already scheduled' : canSubmit(doc) ? 'Request this time →' : 'Choose an available time' }}
                </button>
              </div>
            </div>

            <!-- Active Appointments -->
            <div v-if="navPage==='appointments'" id="appointments" class="space-y-3">
              <div class="account-section-heading"><span class="dashboard-eyebrow">YOUR CARE</span><h2>My Active Appointments</h2><p>Review appointment details, status updates, and any actions available to you.</p></div>
              <div v-if="appointments.length === 0" class="p-4 bg-[#121216] border border-zinc-800 rounded-xl text-xs text-zinc-400"><p>No active appointments linked to this account.</p><p class="mt-2">If you booked as a guest, use your tracking code and verified booking email to link the appointment. Completed appointments appear under Appointment History after linking.</p><button @click="openGuestClaim" class="mt-3 px-3 py-2 bg-blue-700 text-white rounded">Link Guest Appointment</button></div>
              <div v-for="app in activeAppointments" :key="app.id" class="patient-appointment-card p-4 bg-[#121216] border border-zinc-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div class="flex gap-2 items-center"><button @click="showAppointmentDetails(app)" class="font-bold text-blue-400 text-xs hover:underline">{{ app.reference_code }} · View details</button><button v-if="['Booked','Checked_In','Completed'].includes(app.status)" @click="printAppointment(app)" class="text-[10px] px-2 py-1 rounded border border-zinc-700 hover:border-blue-500">Print Slip</button></div>
                  <div class="text-white font-bold">{{ app.doctor_name }} ({{ app.specialty_name }})</div>
                  <div class="text-xs text-zinc-400">{{ app.appointment_date }} @ {{ fmtTime(app.appointment_time) }}</div>
                  <div v-if="app.followup_timeframe" class="text-[11px] text-amber-400 mt-1">Follow-up: {{ app.followup_timeframe }} <span class="text-zinc-500">{{ app.followup_notes }}</span></div>
                  <div v-if="app.status === 'Needs_Reassignment'" class="text-[11px] text-red-400 mt-1">The coordinator is finding you a new schedule.</div>
                  <div v-if="app.status === 'Pending'" class="text-[11px] text-zinc-500 mt-1">Reservation received. Awaiting confirmation.</div>
                  <div class="status-track mt-3" aria-label="Appointment progress"><i class="status-track-bar" aria-hidden="true"><b :key="app.status" :style="{'--p': statusProgress(app)}"></b></i><span class="done">Submitted</span><span :class="Number(app.forwarded_to_doctor) || app.status !== 'Pending' ? 'done' : ''">Coordinator</span><span :class="Number(app.doctor_accepted) || ['Booked','Checked_In','Completed'].includes(app.status) ? 'done' : ''">Doctor</span><span :class="(['Booked','Checked_In','Completed'].includes(app.status) && Number(app.patient_notified)) ? 'done' : ''">Confirmed</span><span :class="['Checked_In','Completed'].includes(app.status) ? 'done' : ''">Check-in</span><span :class="app.status === 'Completed' ? 'done' : ''">Completed</span></div>
                  <p v-if="appointmentNextStep(app)" class="appointment-next-step" aria-live="polite"><strong>Next step:</strong> {{ appointmentNextStep(app) }}</p>
                  <div v-if="app.status === 'Proposed'" class="text-[11px] text-sky-400 mt-1">The clinic proposed this follow-up. Please confirm or decline.</div>
                </div>
                <div class="flex items-center gap-2">
                  <span :title="statusHelp(app.status)" :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span>
                  <template v-if="app.status === 'Proposed'">
                    <button @click="respondFollowup(app, true)" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded">Confirm</button>
                    <button @click="respondFollowup(app, false)" class="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 text-xs rounded">Decline</button>
                  </template>
                  <button v-if="canModify(app)" @click="cancelAppointment(app.id)" class="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 text-xs rounded">Cancel</button>
                  <button v-if="canModify(app)" @click="rescheduleAppointment(app)" class="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-blue-400 border border-blue-800 text-xs rounded">Reschedule</button>
                </div>
              </div>
            </div>
            <section v-if="navPage==='dashboard'" class="dashboard-shortcuts">
              <div class="dashboard-shortcuts-heading">
                <div><span class="dashboard-eyebrow">QUICK ACCESS</span><h3>What would you like to do?</h3></div>
                <p>Your most-used clinic tools are just a tap away.</p>
              </div>
              <div class="quick-actions">
                <button @click="openPatientBooking"><span class="shortcut-symbol" aria-hidden="true">＋</span><span><strong>Book an appointment</strong><small>Find a doctor and request a visit</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></button>
                <button @click="navPage='appointments'"><span class="shortcut-symbol" aria-hidden="true">▣</span><span><strong>My appointments</strong><small>Review schedules and appointment status</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></button>
                <button @click="openGuestClaim"><span class="shortcut-symbol" aria-hidden="true">↗</span><span><strong>Link a guest appointment</strong><small>Connect a previous booking to your account</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></button>
                <button @click="navPage='notifications'"><span class="shortcut-symbol" aria-hidden="true">♢</span><span><strong>Notifications</strong><small>See updates from your clinic</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></button>
              </div>
            </section>

          </div>

          <!-- 2. CARE COORDINATOR / NURSE VIEW -->
          <div v-if="activeRole === 'coordinator' && ['dashboard','appointments','queue','schedule'].includes(navPage)" :class="navPage==='dashboard' ? 'coordinator-dashboard space-y-6' : 'space-y-6'">
            <section v-if="navPage==='dashboard'" class="coordinator-welcome">
              <div class="coordinator-welcome-copy">
                <span class="coordinator-dashboard-eyebrow">CLINIC OPERATIONS</span>
                <h2>Good day,<br><strong>{{ currentUser.full_name }}</strong></h2>
                <p>Coordinate appointments, support walk-in patients, and keep today’s clinic running smoothly.</p>
                <div class="coordinator-welcome-actions">
                  <button @click="openWalkinModal" class="coordinator-primary-action">＋ Register a walk-in <span aria-hidden="true">→</span></button>
                  <button @click="navPage='appointments'" class="coordinator-secondary-action">Manage appointments</button>
                </div>
              </div>
              <div class="coordinator-profile-panel" aria-label="Coordinator workspace">
                <div class="coordinator-profile-avatar" aria-hidden="true">{{ currentUser.full_name.charAt(0) }}</div>
                <span class="coordinator-profile-label">COORDINATION DESK</span>
                <strong>Clinic operations</strong>
                <span class="coordinator-profile-status"><i aria-hidden="true"></i> Workspace active</span>
              </div>
            </section>

            <div :class="['coordinator-status-grid', navPage==='dashboard' ? 'coordinator-dashboard-status' : '']">
              <div v-for="(c, index) in statusCounts" :key="c.label" class="coordinator-status-card">
                <span><i aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</i>{{ c.label }}</span>
                <strong :class="c.color">{{ c.count }}</strong>
                <small>{{ c.label === 'Pending' ? 'awaiting clinic review' : c.label === 'Booked' ? 'ready for a clinic visit' : c.label === 'Needs Reassignment' ? 'need a new schedule' : 'appointments cancelled' }}</small>
              </div>
            </div>

            <div v-if="navPage==='dashboard'" class="coordinator-section-heading">
              <div><span class="coordinator-dashboard-eyebrow">TODAY'S OPERATIONS</span><h3>Clinic flow</h3></div>
              <span>{{ today }}</span>
            </div>
            <div v-if="navPage==='queue' || navPage==='dashboard'" id="queue" class="queue-strip">
              <div><span>pending approval</span><b>{{ appointments.filter(a => a.status === 'Pending').length }}</b></div>
              <div><span>needs reassignment</span><b>{{ appointments.filter(a => a.status === 'Needs_Reassignment').length }}</b></div>
              <div><span>waiting</span><b>{{ appointments.filter(a => a.status === 'Booked').length }}</b></div>
              <div><span>checked in</span><b>{{ appointments.filter(a => a.status === 'Checked_In').length }}</b></div>
              <div><span>completed</span><b>{{ appointments.filter(a => a.status === 'Completed').length }}</b></div>
              <div><span>needs action</span><b>{{ appointments.filter(a => hasCoordAction(a)).length }}</b></div>
            </div>
            <section v-if="navPage==='dashboard'" class="coordinator-today-panel" aria-labelledby="coordinator-today-heading">
              <div class="coordinator-today-heading">
                <div><span class="coordinator-dashboard-eyebrow">TODAY · {{ today }}</span><h3 id="coordinator-today-heading">Requests needing attention</h3></div>
                <button type="button" @click="navPage='appointments'">Review appointments <span aria-hidden="true">→</span></button>
              </div>
              <p v-if="todayPendingRequests.length === 0" class="coordinator-today-empty">No pending requests or schedule changes for today.</p>
              <div v-else class="coordinator-today-list">
                <button v-for="app in todayPendingRequests.slice(0, 5)" :key="app.id" type="button" class="coordinator-today-item" @click="showAppointmentDetails(app)">
                  <span class="coordinator-today-time">{{ fmtTime(app.appointment_time) }}</span>
                  <span class="coordinator-today-patient"><strong>{{ app.patient_name }}</strong><small>{{ app.doctor_name }} · {{ app.reference_code }}</small></span>
                  <span :class="['coordinator-today-status', statusClass(app.status)]">{{ statusLabel(app.status) }}</span>
                  <span class="coordinator-today-arrow" aria-hidden="true">→</span>
                </button>
                <button v-if="todayPendingRequests.length > 5" type="button" class="coordinator-today-more" @click="navPage='appointments'">View {{ todayPendingRequests.length - 5 }} more requests</button>
              </div>
            </section>
            <section v-if="navPage==='dashboard'" class="coordinator-workspace-tools">
              <div class="coordinator-tools-heading">
                <div><span class="coordinator-dashboard-eyebrow">YOUR WORKSPACE</span><h3>Keep the clinic day on track</h3></div>
                <p>Jump directly to the tools you use most.</p>
              </div>
              <div class="coordinator-tool-actions">
                <button @click="navPage='appointments'" class="coordinator-tool-card"><span aria-hidden="true">▤</span><span><strong>Appointments</strong><small>Review requests and update patient visits</small></span><b aria-hidden="true">→</b></button>
                <button @click="navPage='queue'" class="coordinator-tool-card"><span aria-hidden="true">◷</span><span><strong>Patient queue</strong><small>See today’s arrivals and check-in status</small></span><b aria-hidden="true">→</b></button>
                <button @click="navPage='schedule'" class="coordinator-tool-card"><span aria-hidden="true">▦</span><span><strong>Doctor schedules</strong><small>Manage availability and commitments</small></span><b aria-hidden="true">→</b></button>
              </div>
            </section>
            <div v-if="navPage==='queue'" class="page-card"><div class="queue-head"><h3>Today's Patient Queue</h3><span>{{ today }}</span></div><div v-if="todayQueue.length===0" class="empty-state">No patients scheduled for today.</div><div v-for="(app,i) in todayQueue" :key="app.id" class="queue-row"><b>#{{ String(i+1).padStart(2,'0') }}</b><div><strong>{{ app.patient_name }}</strong><small>{{ app.doctor_name }} · {{ fmtTime(app.appointment_time) }}</small></div><span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span><button @click="showAppointmentDetails(app)">Details</button></div></div>

            <div v-if="navPage==='appointments'" class="flex flex-col sm:flex-row gap-2">
              <input v-model="dateFilter" type="date" aria-label="Filter appointments by date" class="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs">
              <select v-model="doctorFilter" aria-label="Filter appointments by doctor" class="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs"><option value="">All doctors</option><option v-for="d in apptDoctorOptions" :key="d" :value="d">{{ d }}</option></select>
              <input v-model="search" type="search" aria-label="Search appointments by patient, reference, or doctor" placeholder="Search: name, ref code, doctor..." class="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500">
              <select v-model="statusFilter" aria-label="Filter appointments by status" class="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Booked">Booked</option>
                <option value="Needs_Reassignment">Needs Reassignment</option>
                <option value="Proposed">Proposed</option>
                <option value="Checked_In">Checked In</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div v-if="navPage==='schedule'" id="schedule" class="p-4 bg-[#121216] border border-zinc-800 rounded-xl">
              <button @click="showSchedule = !showSchedule" class="w-full flex justify-between items-center text-xs font-bold text-zinc-300">
                <span>🗓️ Doctor Schedules <span class="text-zinc-500 font-normal">(workdays and worktime)</span></span>
                <span class="text-zinc-500">{{ showSchedule ? '▲' : '▼' }}</span>
              </button>
              <div v-if="showSchedule" class="mt-3 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <div><b class="text-xs text-zinc-200">Doctor accounts</b><p class="mt-1 text-[10px] text-zinc-500">Create a doctor profile and sign-in together.</p></div>
                  <button @click="createDoctorAccount" :disabled="!specialties.length" class="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-500 disabled:opacity-50">+ Create doctor account</button>
                </div>
                <div v-for="d in schedule" :key="d.id" class="border-t border-zinc-800 pt-3 text-xs">
                  <div class="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span class="font-bold text-zinc-200">{{ d.name }}</span> <span class="text-zinc-500">({{ d.specialty_name }})</span>
                      <div class="text-[10px] text-zinc-400 mt-0.5">Schedule: {{ doctorScheduleLabel(d) }}</div>
                    </div>
                    <div class="flex gap-2">
                      <button @click="editWorkSchedule(d)" class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-bold">Workdays & Worktime</button>
                      <button @click="addCommitment(d)" class="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-[10px] font-bold">+ Commitment / Blockout</button>
                    </div>
                  </div>
                  <div v-if="d.blockouts.length" class="mt-2 flex flex-wrap gap-1">
                    <span v-for="b in d.blockouts" :key="b.id" class="px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-300">
                      {{ b.block_date }} · {{ b.type }}<span v-if="b.reason"> · {{ b.reason }}</span>
                      <button @click="removeBlockout(b)" class="ml-1 text-red-400">✕</button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="navPage==='schedule' && pendingLeaves.length" class="p-4 bg-[#121216] border border-amber-800/60 rounded-xl space-y-2">
              <div class="text-xs font-bold text-amber-400">Leave Requests Awaiting Decision</div>
              <div v-for="l in pendingLeaves" :key="l.id" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-zinc-800 pt-2">
                <div>
                  <span class="font-bold text-zinc-200">{{ l.doctor_name }}</span>
                  <span class="text-zinc-400"> · {{ l.start_date }} → {{ l.end_date }}</span>
                  <div class="text-[10px] text-zinc-500">{{ l.reason || '—' }}</div>
                </div>
                <div class="flex gap-2">
                  <button @click="decideLeave(l, 'approve')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold">Approve</button>
                  <button @click="decideLeave(l, 'reject')" class="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] font-bold">Reject</button>
                </div>
              </div>
            </div>

            <div v-if="navPage==='appointments'" id="appointments" class="appointments-table-scroll overflow-auto border border-zinc-800 rounded-xl bg-[#121216]">
              <table class="w-full text-left text-xs">
                <thead class="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
                  <tr>
                    <th class="p-3">Ref</th>
                    <th class="p-3">Patient</th>
                    <th class="p-3">Doctor & Specialty</th>
                    <th class="p-3">Schedule</th>
                    <th class="p-3">Follow-Up / Notes</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60">
                  <tr v-if="filteredAppointments.length === 0"><td colspan="7" class="p-6 text-center text-zinc-500">Nothing found.</td></tr>
                  <tr v-for="app in filteredAppointments" :key="app.id" class="hover:bg-zinc-900/40">
                    <td class="p-2.5 font-bold text-blue-400">{{ app.reference_code }}</td>
                    <td class="p-2.5 font-bold text-zinc-200">{{ app.patient_name }}</td>
                    <td class="p-2.5">{{ app.doctor_name }} <span class="text-zinc-500 text-[10px]">({{ app.specialty_name }})</span></td>
                    <td class="p-2.5 font-mono">{{ app.appointment_date }} @ {{ fmtTime(app.appointment_time) }}</td>
                    <td class="p-2.5">
                      <span v-if="app.followup_timeframe" class="text-amber-400 font-bold text-[11px] block">{{ app.followup_timeframe }}</span>
                      <span class="text-zinc-500 text-[10px]">{{ app.followup_notes || '—' }}</span>
                    </td>
                    <td class="p-2.5">
                      <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span>
                      <div v-if="app.decline_reason && app.status === 'Needs_Reassignment'" class="text-[10px] text-zinc-500 mt-1">{{ app.decline_reason }}</div>
                      <div v-if="app.status === 'Pending'" class="text-[10px] text-zinc-500 mt-1">{{ stageText(app) }}</div>
                    </td>
                    <td class="p-2.5">
                      <div v-if="hasAppointmentActions(app)" class="appointment-action-list">
                        <button v-if="app.status === 'Pending' && !Number(app.forwarded_to_doctor)" @click="forwardToDoctor(app)" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold">Forward to Doctor</button>
                        <button v-if="(app.booked_by_role==='coordinator' || app.booked_by_role==='guest') && !app.patient_id" @click="linkWalkinCoordinator(app)" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold">Link Guest / Walk-in History</button>
                        <button v-if="app.status === 'Needs_Reassignment'" @click="reassignApp(app)" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold">Reassign to Another Doctor</button>
                        <button v-if="(app.status === 'Booked' || app.status === 'Proposed') && app.patient_id && !Number(app.patient_notified)" @click="relayToPatient(app)" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold">Send to Patient</button>
                        <button v-if="app.status === 'Booked'" @click="checkInPatient(app)" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold">Check-in</button>
                        <button v-if="app.status === 'Completed' && app.followup_timeframe && !Number(app.followup_relayed)" @click="scheduleFollowup(app)" class="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px] font-bold">Schedule Follow-up</button>
                      </div>
                      <span v-else class="appointment-no-actions">No actions</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 3. DOCTOR VIEW -->
          <div v-if="activeRole === 'doctor' && ['dashboard','appointments','schedule'].includes(navPage)" :class="navPage==='dashboard' ? 'doctor-dashboard space-y-6' : 'space-y-6'">
            <section v-if="navPage==='dashboard'" class="doctor-welcome">
              <div class="doctor-welcome-copy">
                <span class="doctor-dashboard-eyebrow">CLINICAL WORKSPACE</span>
                <h2>Good day,<br><strong>{{ currentUser.full_name }}</strong></h2>
                <p>Review patient requests, manage your clinic schedule, and keep care moving forward.</p>
                <div class="doctor-welcome-actions">
                  <button @click="openDoctorRequests" class="doctor-primary-action">Review appointments <span aria-hidden="true">→</span></button>
                  <button @click="fileLeave" class="doctor-secondary-action">▦ Manage leave</button>
                </div>
              </div>
              <div class="doctor-profile-panel">
                <div class="doctor-profile-avatar" aria-hidden="true">{{ currentUser.full_name.charAt(0) }}</div>
                <span class="doctor-profile-label">SIGNED-IN DOCTOR</span>
                <strong>{{ myDoctor ? myDoctor.name : currentUser.full_name }}</strong>
                <span v-if="myDoctor && myDoctor.specialty_name" class="doctor-specialty-badge">{{ myDoctor.specialty_name }}</span>
                <span class="doctor-profile-status"><i aria-hidden="true"></i> Workspace active</span>
              </div>
            </section>

            <div v-if="navPage==='dashboard'" class="dashboard-grid">
              <div class="metric-card"><span><i aria-hidden="true">01</i> Needs Review</span><strong>{{ doctorApps.filter(a => a.status === 'Pending').length }}</strong><small>appointment requests</small></div>
              <div class="metric-card"><span><i aria-hidden="true">02</i> Checked In</span><strong>{{ doctorApps.filter(a => a.status === 'Checked_In').length }}</strong><small>patients waiting</small></div>
              <div class="metric-card"><span><i aria-hidden="true">03</i> Completed</span><strong>{{ appointments.filter(a => a.status === 'Completed').length }}</strong><small>consultations</small></div>
            </div>

            <div v-if="navPage==='dashboard'" class="doctor-workspace-tools">
              <div>
                <span class="doctor-dashboard-eyebrow">YOUR WORKSPACE</span>
                <h3>Keep your clinic day on track</h3>
                <p>Quickly reach the tools you need to manage patient care.</p>
              </div>
              <div class="doctor-tool-actions">
                <button @click="navPage='appointments'" class="doctor-tool-card"><span aria-hidden="true">▤</span><span><strong>My appointments</strong><small>Review requests and patient visits</small></span><b aria-hidden="true">→</b></button>
                <button @click="navPage='schedule'" class="doctor-tool-card"><span aria-hidden="true">▦</span><span><strong>Schedule & leave</strong><small>View your availability and leave</small></span><b aria-hidden="true">→</b></button>
              </div>
            </div>

            <div v-if="navPage==='dashboard' && doctorApps.some(a => a.status === 'Pending')" class="doctor-pending-notice">
              <div class="doctor-notice-icon" aria-hidden="true">!</div>
              <div><div class="text-sm font-bold">Appointment requests need your review</div><p>{{ doctorApps.filter(a => a.status === 'Pending').length }} patient request(s) are waiting for your decision. The Coordinator will relay your response.</p></div>
              <button @click="openDoctorRequests">Review requests <span aria-hidden="true">→</span></button>
            </div>

            <section v-if="navPage==='schedule'" class="doctor-schedule-heading">
              <div><span class="doctor-dashboard-eyebrow">AVAILABILITY</span><h2>Schedule & leave</h2><p>Review your clinic schedule and let the Coordinator know when you are unavailable.</p></div>
              <button @click="fileLeave">＋ Request leave / blockout</button>
            </section>

            <div v-if="navPage==='appointments'" class="account-section-heading doctor-appointments-heading"><span class="doctor-dashboard-eyebrow">PATIENT CARE</span><h2>My appointment requests</h2><p>Review requests forwarded by the Coordinator and update each consultation as care progresses.</p></div>

            <div v-if="navPage==='schedule' || navPage==='dashboard'" id="schedule" :class="['doctor-link-status p-3 rounded-xl text-xs border', myDoctor ? 'bg-purple-950/30 border-purple-900 text-purple-200' : 'bg-red-950/40 border-red-800 text-red-300']">
              <template v-if="myDoctor">You are logged in as <b>{{ myDoctor.name }}</b>. Patient requests assigned to you appear here immediately; legacy requests may still need Coordinator forwarding.</template>
              <template v-else>This account is not linked to any doctor, so nothing will appear. Log in with a doctor account (e.g. dr_cruz).</template>
            </div>

            <div v-if="navPage==='schedule' && leaves.length" class="doctor-leave-list p-3 bg-[#121216] border border-zinc-800 rounded-xl text-xs space-y-1">
              <div class="doctor-leave-heading"><span class="doctor-dashboard-eyebrow">TIME AWAY</span><h3>My leave & blockouts</h3><p>Your recent leave requests and their review status.</p></div>
              <div v-for="l in leaves.slice(0, 5)" :key="l.id" class="doctor-leave-row flex justify-between">
                <span class="font-mono text-zinc-300">{{ l.start_date }} → {{ l.end_date }} <span class="text-zinc-500">({{ l.leave_type }})</span></span>
                <span :class="['font-bold', l.status === 'Approved' ? 'text-emerald-400' : l.status === 'Rejected' ? 'text-red-400' : 'text-amber-400']">{{ l.status }}</span>
              </div>
            </div>

            <div v-if="navPage==='appointments'" id="appointments" class="grid md:grid-cols-2 gap-4">
              <div v-if="doctorApps.length === 0" class="doctor-empty-appointments col-span-2 p-8 bg-[#121216] border border-zinc-800 rounded-xl text-center text-zinc-500">
                No appointments need review right now. New patient requests will appear here as soon as they are booked.
              </div>
              <div v-for="app in doctorApps" :key="app.id" class="doctor-appointment-card p-4 bg-[#121216] border border-zinc-800 rounded-xl space-y-3">
                <div class="flex justify-between items-start gap-2">
                  <div>
                    <span class="font-bold text-zinc-100">{{ app.patient_name }}</span>
                    <div class="text-[10px] text-zinc-500">{{ app.reference_code }} · {{ app.contact_number || 'no contact' }}</div>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-blue-400 font-mono">{{ app.appointment_date }} @ {{ fmtTime(app.appointment_time) }}</span>
                    <div><span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', statusClass(app.status)]">{{ statusLabel(app.status) }}</span></div>
                  </div>
                </div>
                <div v-if="app.coordinator_note" class="text-[11px] text-blue-300 bg-blue-950/40 border border-blue-900 rounded p-2">Coordinator note: {{ app.coordinator_note }}</div>
                <div v-if="app.followup_timeframe" class="text-[11px] text-amber-400">Follow-up: {{ app.followup_timeframe }}</div>
                <div class="flex gap-2 pt-2">
                  <template v-if="app.status === 'Pending'">
                    <button @click="doctorDecision(app.id, 'accept')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-bold">Accept</button>
                    <button @click="doctorDecision(app.id, 'decline')" class="flex-1 bg-red-600 hover:bg-red-500 text-white py-1.5 rounded text-xs font-bold">Decline</button>
                  </template>
                  <button v-if="app.status === 'Checked_In'" @click="doctorComplete(app)" class="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-1.5 rounded text-xs font-bold">Consultation Done</button>
                  <button v-if="app.status === 'Completed'" @click="setFollowupAdvice(app.id)" class="px-2 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded text-xs">Follow-up Advice</button>
                </div>
              </div>
            </div>
          </div>

          </main>
        </div>
      </div>

    </div>
  `;
