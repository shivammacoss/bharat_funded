import { BarChart3 } from 'lucide-react';

/**
 * Required-style attribution: TradingView supplies embedded advanced charts / widgets
 * under their terms. Keep visible on the marketing site where charts are advertised.
 */
export default function TradingViewLegalNotice() {
  return (
    <div
      id="tradingview-charts-notice"
      className="mb-8 p-5 rounded-xl bg-[#1E2438] border-2 border-[rgba(255,255,255,0.08)] scroll-mt-24"
    >
      <div className="flex items-start gap-3">
        <BarChart3 size={18} className="text-[#2B4EFF] shrink-0 mt-0.5" aria-hidden />
        <div>
          <div className="text-xs font-bold text-white mb-1.5 uppercase tracking-wide">
            Charts & Widgets by TradingView
          </div>
          <p className="text-xs text-[#9AA0B4] mb-2">
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2B4EFF] font-semibold hover:underline"
            >
              Stock Heatmap by TradingView
            </a>
            {' — '}
            direct link to TradingView as required for embedded widgets.
          </p>
          <p className="text-xs text-[#9AA0B4] leading-relaxed">
            Advanced charts, Stock Heatmap, and related market widgets on Bharath Funded Trader are{' '}
            <strong>provided by TradingView</strong> and are subject to TradingView&apos;s terms,
            policies, and technical requirements. TradingView is a third-party service; Bharath Funded Trader is
            not responsible for TradingView&apos;s data, availability, or chart behaviour. Use of
            these charts and widgets constitutes acceptance of TradingView&apos;s applicable terms.
          </p>
          <p className="mt-2 text-[11px] text-[#9AA0B4]/60 leading-relaxed">
            Learn more:{' '}
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2B4EFF] font-medium hover:underline"
            >
              TradingView.com
            </a>
            {' · '}
            <a
              href="https://www.tradingview.com/policies/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2B4EFF] font-medium hover:underline"
            >
              Policies &amp; terms
            </a>
            {' · '}
            <a
              href="https://www.tradingview.com/widget/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2B4EFF] font-medium hover:underline"
            >
              Widgets
            </a>
            . TradingView and related marks are trademarks of their respective owners.
          </p>
        </div>
      </div>
    </div>
  );
}
