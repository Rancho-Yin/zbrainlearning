import React from 'react';

export default function MidAutumnGreeting({ variant = 'hero' }) {
  return (
    <section className={`seasonal-greeting seasonal-greeting--${variant}`} aria-label="致全体代理商的中秋祝福">
      <p className="greeting-recipient">致全体代理商伙伴</p>
      <h2><span>月满中秋</span><i aria-hidden="true" /><span>同心致远</span></h2>
      <p className="greeting-message">感谢每一位代理商伙伴的信任与同行。<br />愿您与家人团圆常伴，喜乐安康；<br className="greeting-mobile-break" />愿我们同心同行，共赴新程。</p>
      <p className="greeting-signature">智显机器人 <span>敬祝</span></p>
    </section>
  );
}
