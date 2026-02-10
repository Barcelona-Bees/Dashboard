export default function LoginScreen({ onLogin }) {
  return (
    <div className="page">
      <div className="loginCard">
        <div className="logoBig">BB</div>
        <div className="center" style={{ fontWeight: 900, marginBottom: 6 }}>
          Login to access your hive
        </div>

        <div className="field">
          <div className="fieldLabel">User Name</div>
          <input placeholder="kimberlybee@gmail.com" />
        </div>

        <div className="field">
          <div className="fieldLabel">Password</div>
          <input placeholder="********" type="password" />
        </div>

        <button className="loginBtn" onClick={onLogin}>Login</button>
      </div>
    </div>
  );
}
