import { Clock, Mail, MapPin, Phone } from 'lucide-react';

function Contact() {
  return (
    <div className="min-h-screen bg-greyLight">
      {/* Header Section */}
      <div className="border-b border-greyMedium bg-textMain py-20 text-white sm:py-32">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.4em] text-primary">
              B2B Support
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl">
              Enterprise Contact
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg opacity-80">
              Connect with our team for custom bulk quote inquiries, infrastructure proposals,
              and strategic after-sales support.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Cards Section */}
      <div className="container-shell -mt-10 mb-20 sm:-mt-16 sm:mb-32">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Main Info Card */}
          <div className="overflow-hidden rounded-[40px] border border-greyBorder bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-16">
            <div className="space-y-12">
              {/* Office */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-primary shadow-lg shadow-primary/20">
                  <MapPin size={28} className="text-textMain" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-textMain opacity-60">
                    Our Office
                  </h3>
                  <p className="text-base font-semibold leading-relaxed text-slate-700 sm:text-lg">
                    First Floor, 1-121/63 Survey No. 63 Part Hotel,
                    <br className="hidden sm:block" />
                    Sitara Grand Backside, Miyapur, Hyderabad,
                    <br className="hidden sm:block" />
                    Telangana, India 500049
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-primary shadow-lg shadow-primary/20">
                  <Phone size={28} className="text-textMain" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-textMain opacity-60">
                    Phone
                  </h3>
                  <a
                    href="tel:+919701314138"
                    className="group flex items-center text-lg font-bold text-slate-800 transition-all hover:text-primary sm:text-2xl"
                  >
                    +91 97013 14138
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-primary shadow-lg shadow-primary/20">
                  <Mail size={28} className="text-textMain" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-textMain opacity-60">
                    Email
                  </h3>
                  <a
                    href="mailto:sales@sriainfotech.com"
                    className="group break-all text-lg font-bold text-slate-800 transition-all hover:text-primary sm:text-2xl"
                  >
                    sales@sriainfotech.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours Card */}
          <div className="group flex flex-col gap-8 rounded-[40px] border border-white/5 bg-textMain p-8 shadow-2xl transition-all sm:flex-row sm:items-center sm:p-12">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-primary shadow-lg shadow-primary/40">
              <Clock size={28} className="text-textMain" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                Business Hours
              </h3>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-white sm:text-lg">
                  Always available for our partners
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                    Active & Operational 24/7
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Help Text */}
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">
              For technical support call our emergency line or email sales@sriainfotech.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
