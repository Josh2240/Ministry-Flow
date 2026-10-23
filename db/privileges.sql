GRANT USAGE ON SCHEMA public TO ministry_flow_app;

GRANT SELECT, INSERT, UPDATE ON TABLE app_users TO ministry_flow_app;
GRANT SELECT, INSERT, DELETE ON TABLE app_sessions TO ministry_flow_app;
GRANT SELECT, INSERT, DELETE ON TABLE password_reset_tokens TO ministry_flow_app;
GRANT SELECT, INSERT, DELETE ON TABLE google_oauth_states TO ministry_flow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth_rate_limits TO ministry_flow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth_pending_registrations TO ministry_flow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE app_records TO ministry_flow_app;
