const AuthLayout = ({ children, title, subtitle, imageText, imageSubtitle, badge }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-soft backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left Side: Dynamic Content */}
        <div className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(31,143,255,0.4),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(238,141,16,0.3),_transparent_25%)] p-10 lg:block">
          {badge && <p className="text-sm uppercase tracking-[0.35em] text-primary">{badge}</p>}
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">{imageText}</h1>
          <p className="mt-4 max-w-md text-sm text-slate-300">{imageSubtitle}</p>
        </div>

        {/* Right Side: Form Area */}
        <div className="bg-white p-8 text-slate-900 sm:p-10">
          {badge && <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{badge}</p>}
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
