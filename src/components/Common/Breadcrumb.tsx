import Link from "next/link";
import { BreadcrumbProps } from "../../types/breadcrumb"; // Adjust the import path based on your project structure

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  pageName,
  pageDescription,
}) => {
  return (
    <div className="relative z-10 overflow-hidden bg-white/90 border-b border-slate-200/70 pb-[60px] pt-[80px] md:pt-[100px] lg:pt-[120px] shadow-sm backdrop-blur-xl">
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="container mx-auto">
        <div className="-mx-4 flex flex-wrap items-center">
          <div className="w-full px-4">
            <div className="text-center">
              <h1 className="text-slate-900 mb-4 text-3xl font-bold sm:text-4xl md:text-[40px] md:leading-[1.2]">
                {pageName}
              </h1>
              {pageDescription && (
                <p className="text-slate-600 mb-5 text-base max-w-3xl mx-auto">
                  {pageDescription}
                </p>
              )}

              <ul className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full bg-slate-100/80 px-4 py-2 text-sm text-slate-600 shadow-sm">
                <li>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 font-medium text-slate-700 transition hover:text-primary"
                  >
                    Home
                  </Link>
                </li>
                <li className="inline-flex items-center gap-2 text-slate-400">
                  <span>/</span>
                  <span className="font-semibold text-slate-700">{pageName}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
