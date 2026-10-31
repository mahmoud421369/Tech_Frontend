import React, { memo, useMemo } from 'react';

const THEME = {
  light: { '--ink': '#022c22', '--acc': '#34d399', '--card': '#ffffff', '--soft': '#d1fae5', '--mid': '#a7f3d0' },
  dark: { '--ink': '#000000', '--acc': '#39ff88', '--card': '#3a3a3a', '--soft': '#262626', '--mid': '#505050' },
};

const mix = (a, pct, b) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

const themeStyle = (th) => ({
  '--ink': th.ink || '#022c22',
  '--acc': th.a,
  '--card': mix(th.a, 14, '#ffffff'),
  '--soft': th.c,
  '--mid': mix(th.a, 45, '#ffffff'),
  '--amb': mix(th.a, 70, '#ffffff'),
  '--sky': mix(th.a, 55, th.c),
  '--vio': mix(th.a, 35, th.c),
  '--ros': mix(th.a, 50, '#ffffff'),
});

const AMB = 'var(--amb, #fbbf24)';
const SKY = 'var(--sky, #38bdf8)';
const VIO = 'var(--vio, #a78bfa)';
const ROS = 'var(--ros, #fb7185)';

const ART_CSS = `
  @keyframes haFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes haSpin { to { transform: rotate(360deg); } }
  @keyframes haTwinkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.75); } }
  .ha-f1 { animation: haFloat 4s ease-in-out infinite; }
  .ha-f2 { animation: haFloat 5s ease-in-out -1.2s infinite; }
  .ha-f3 { animation: haFloat 4.5s ease-in-out -2.4s infinite; }
  .ha-spin { transform-origin: 200px 200px; animation: haSpin 70s linear infinite; }
  .ha-tw { transform-box: fill-box; transform-origin: center; animation: haTwinkle 2.4s ease-in-out infinite; }
  .hero-stage[data-paused="true"] svg * { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) { .ha-f1, .ha-f2, .ha-f3, .ha-spin, .ha-tw { animation: none; } }
`;
let artStylesInjected = false;
const injectArtStylesOnce = () => {
  if (artStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-hero-art', 'true');
  tag.textContent = ART_CSS;
  document.head.appendChild(tag);
  artStylesInjected = true;
};
injectArtStylesOnce();

const IC = {
  shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
  wrench: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  check: 'M5 12.5l5 5 9-10.5',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z',
  clock: 'M12 7v5l3 2',
  gift: 'M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
};

const Ic = ({ d, x, y, s = 2, fill = 'none', sw = 2.2, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot} 12 12) scale(${s})`}>
    <path d={d} fill={fill} stroke="var(--ink)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Blk = ({ x, y, w, h, r = 12, fill = 'var(--card)', sh = 6, sw = 3, children }) => (
  <g>
    <rect x={x + sh} y={y + sh} width={w} height={h} rx={r} fill="var(--ink)" />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke="var(--ink)" strokeWidth={sw} />
    {children}
  </g>
);

const Bar = ({ x, y, w, h = 6, fill = 'var(--mid)' }) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />;

const Spark = ({ x, y, s = 9, fill = 'var(--acc)', delay = 0 }) => (
  <path
    className="ha-tw"
    style={{ animationDelay: `${delay}s` }}
    d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`}
    fill={fill}
    stroke="var(--ink)"
    strokeWidth="1.5"
    strokeLinejoin="round"
  />
);

const Float = ({ n = 1, children }) => <g className={`ha-f${n}`}>{children}</g>;

const Chip = ({ x, y, s = 72, fill, icon, is = 2.1, iconFill = 'none' }) => (
  <Blk x={x} y={y} w={s} h={s} r={18} fill={fill}>
    <Ic d={IC[icon]} x={x + (s - 24 * is) / 2} y={y + (s - 24 * is) / 2} s={is} fill={iconFill} />
  </Blk>
);

const Stars = ({ x, y, n = 5 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => (
      <Ic key={i} d={IC.star} x={x + i * 21} y={y} s={0.85} fill={AMB} sw={2} />
    ))}
  </>
);

const Phone = ({ x, y, w = 124, h = 240, rot = 0, sh = 8, children }) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <Blk x={x} y={y} w={w} h={h} r={24} sh={sh} />
    <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx="17" fill="var(--soft)" />
    <rect x={x + w / 2 - 16} y={y + 14} width="32" height="6" rx="3" fill="var(--ink)" />
    {children}
  </g>
);

const Back = () => <ellipse cx="200" cy="362" rx="112" ry="9" fill="var(--ink)" opacity=".18" />;

const Home = () => (
  <>
    <Back />
    <Float n={2}><Chip x={36} y={92} s={80} fill={AMB} icon="wrench" is={2.5} /></Float>
    <Float n={3}><Chip x={290} y={78} s={72} fill={SKY} icon="shield" /></Float>
    <Phone x={138} y={62} rot={-5}>
      <rect x="150" y="92" width="100" height="54" rx="12" fill="var(--acc)" stroke="var(--ink)" strokeWidth="2.5" />
      <Bar x="160" y="104" w="58" fill="var(--card)" />
      <Bar x="160" y="122" w="38" fill="var(--ink)" />
      <Blk x={150} y={158} w={100} h={40} r={10} sh={3} sw={2.5}>
        <circle cx="168" cy="178" r="8" fill={AMB} stroke="var(--ink)" strokeWidth="2" />
        <Bar x="184" y="170" w="52" /><Bar x="184" y="184" w="32" />
      </Blk>
      <Blk x={150} y={208} w={100} h={40} r={10} sh={3} sw={2.5}>
        <circle cx="168" cy="228" r="8" fill={SKY} stroke="var(--ink)" strokeWidth="2" />
        <Bar x="184" y="220" w="46" /><Bar x="184" y="234" w="28" />
      </Blk>
      <rect x="150" y="260" width="100" height="34" rx="12" fill={AMB} stroke="var(--ink)" strokeWidth="2.5" />
      <Bar x="174" y="274" w="52" fill="var(--ink)" />
    </Phone>
    <Float n={1}>
      <Blk x={30} y={242} w={132} h={68} r={16}>
        <Stars x={42} y={252} />
        <Bar x="44" y="286" w="84" />
      </Blk>
    </Float>
    <Float n={2}>
      <Blk x={266} y={232} w={92} h={62} r={16} fill={VIO}>
        <Ic d={IC.bolt} x={290} y={242} s={1.8} fill={AMB} />
        <Bar x="318" y="258" w="28" fill="var(--card)" />
      </Blk>
    </Float>
    <Spark x={110} y={50} /><Spark x={344} y={200} s={7} fill={AMB} delay={0.8} /><Spark x={64} y={214} s={6} fill={ROS} delay={1.4} />
  </>
);

const Devices = () => (
  <>
    <Back />
    <Blk x={84} y={100} w={232} h={148} r={14}>
      <rect x="96" y="112" width="208" height="124" rx="8" fill="var(--soft)" />
      <Bar x="110" y="126" w="70" h="8" fill="var(--acc)" />
      <Bar x="110" y="144" w="44" />
      <rect x="110" y="170" width="24" height="52" rx="4" fill={SKY} stroke="var(--ink)" strokeWidth="2" />
      <rect x="142" y="150" width="24" height="72" rx="4" fill="var(--acc)" stroke="var(--ink)" strokeWidth="2" />
      <rect x="174" y="184" width="24" height="38" rx="4" fill={AMB} stroke="var(--ink)" strokeWidth="2" />
      <circle cx="262" cy="170" r="30" fill="none" stroke={VIO} strokeWidth="16" strokeDasharray="120 70" />
      <circle cx="262" cy="170" r="38" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="262" cy="170" r="22" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
    </Blk>
    <rect x="62" y="260" width="276" height="18" rx="9" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
    <rect x="170" y="260" width="60" height="7" rx="3.5" fill="var(--ink)" />
    <Float n={1}>
      <Phone x={276} y={168} w={84} h={162} rot={8} sh={6}>
        <rect x="286" y="190" width="64" height="46" rx="9" fill="var(--acc)" stroke="var(--ink)" strokeWidth="2.5" />
        <Bar x="286" y="248" w="64" /><Bar x="286" y="262" w="40" /><Bar x="286" y="282" w="52" fill={AMB} />
      </Phone>
    </Float>
    <Float n={3}>
      <Blk x={34} y={196} w={100} h={130} r={14} fill={VIO}>
        <rect x="44" y="206" width="80" height="110" rx="8" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="84" cy="244" r="16" fill={AMB} stroke="var(--ink)" strokeWidth="2.5" />
        <Bar x="56" y="274" w="56" /><Bar x="56" y="288" w="36" />
      </Blk>
    </Float>
    <Float n={2}>
      <Blk x={262} y={36} w={104} h={50} r={14} fill={AMB}>
        <circle cx="286" cy="52" r="6" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="304" cy="70" r="6" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
        <path d="M306 50L284 72" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
        <Bar x="322" y="54" w="32" fill="var(--ink)" />
      </Blk>
    </Float>
    <Spark x={60} y={110} /><Spark x={352} y={130} s={7} fill={ROS} delay={1} />
  </>
);

const Track = () => (
  <>
    <Back />
    <path d="M70 250C70 190 120 170 150 150S200 110 262 104" fill="none" stroke="var(--ink)" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
    <Float n={2}>
      <Blk x={34} y={64} w={140} h={68} r={16}>
        <path d="M58 98H122" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="58" cy="98" r="9" fill="var(--acc)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="90" cy="98" r="9" fill="var(--acc)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="122" cy="98" r="9" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
        <Bar x="48" y="116" w="80" h="5" />
      </Blk>
    </Float>
    <Float n={3}>
      <g>
        <path d="M322 160C298 134 292 120 292 106a30 30 0 0160 0c0 14-6 28-30 54z" fill="var(--ink)" transform="translate(6 6)" />
        <path d="M322 160C298 134 292 120 292 106a30 30 0 0160 0c0 14-6 28-30 54z" fill={ROS} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="322" cy="106" r="11" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
      </g>
    </Float>
    <Float n={1}>
      <Blk x={150} y={150} w={78} h={66} r={10} fill={AMB}>
        <rect x="178" y="150" width="22" height="66" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
        <rect x="156" y="186" width="16" height="22" rx="3" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
      </Blk>
    </Float>
    <Blk x={56} y={228} w={178} h={86} r={12} sh={7} />
    <Blk x={236} y={246} w={96} h={68} r={14} fill="var(--acc)" sh={7}>
      <path d="M296 256h18a14 14 0 0114 14v10h-32z" fill={SKY} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
    </Blk>
    <Bar x="74" y="248" w="90" h="8" fill="var(--acc)" /><Bar x="74" y="268" w="132" /><Bar x="74" y="284" w="70" />
    {[110, 286].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy="322" r="20" fill="var(--ink)" />
        <circle cx={cx} cy="322" r="8" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
      </g>
    ))}
    <Spark x={48} y={190} /><Spark x={356} y={246} s={7} fill={AMB} delay={0.9} />
  </>
);

const Account = () => (
  <>
    <Back />
    <Blk x={104} y={78} w={192} h={236} r={22} sh={8}>
      <rect x="104" y="78" width="192" height="72" rx="20" fill="var(--acc)" stroke="var(--ink)" strokeWidth="3" />
      <rect x="106" y="120" width="188" height="30" fill="var(--acc)" />
      <path d="M104 150H296" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="200" cy="150" r="38" fill={AMB} stroke="var(--ink)" strokeWidth="3" />
      <circle cx="200" cy="140" r="12" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M176 172a24 20 0 0148 0" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
      <Bar x="160" y="204" w="80" h="9" fill="var(--ink)" />
      <Bar x="172" y="222" w="56" />
      <Blk x={124} y={244} w={152} h={24} r={8} sh={3} sw={2.5}><Bar x="136" y="253" w="64" /></Blk>
      <Blk x={124} y={278} w={152} h={24} r={8} sh={3} sw={2.5}><Bar x="136" y="287" w="48" /></Blk>
    </Blk>
    <Float n={2}><Chip x={34} y={128} s={70} fill={ROS} icon="bell" /></Float>
    <Float n={3}><Chip x={36} y={252} s={72} fill={SKY} icon="shield" /></Float>
    <Float n={1}>
      <Blk x={268} y={54} w={100} h={80} r={16}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="288" cy={76 + i * 22} r="7" fill={i < 2 ? 'var(--acc)' : 'var(--card)'} stroke="var(--ink)" strokeWidth="2.2" />
            <Bar x="302" y={73 + i * 22} w={48 - i * 8} />
          </g>
        ))}
      </Blk>
    </Float>
    <Float n={2}><Chip x={300} y={236} s={64} fill={AMB} icon="check" is={2} /></Float>
    <Spark x={90} y={64} /><Spark x={352} y={190} s={7} fill={VIO} delay={1.1} />
  </>
);

const Repair = () => (
  <>
    <Back />
    <Phone x={128} y={64} w={128} h={244} rot={-4}>
      <circle cx="192" cy="152" r="40" fill="var(--acc)" stroke="var(--ink)" strokeWidth="3.5" />
      <Ic d={IC.check} x={166} y={126} s={2.2} sw={2.6} />
      <Bar x="150" y="212" w="84" h="9" fill="var(--ink)" />
      <Bar x="162" y="230" w="60" />
      <rect x="150" y="256" width="84" height="30" rx="10" fill={AMB} stroke="var(--ink)" strokeWidth="2.5" />
    </Phone>
    <Float n={2}>
      <g transform="translate(236 196) rotate(-18) scale(5.4)">
        <path d={IC.wrench} fill={AMB} stroke="var(--ink)" strokeWidth="0.7" strokeLinejoin="round" transform="translate(0.4 0.4)" opacity="0" />
        <path d={IC.wrench} fill={AMB} stroke="var(--ink)" strokeWidth="0.75" strokeLinejoin="round" />
      </g>
    </Float>
    <g className="ha-spin" style={{ transformOrigin: '84px 112px' }}>
      <circle cx="84" cy="112" r="28" fill="none" stroke={VIO} strokeWidth="14" strokeDasharray="9 7.6" />
      <circle cx="84" cy="112" r="22" fill={VIO} stroke="var(--ink)" strokeWidth="3" />
      <circle cx="84" cy="112" r="7" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
    </g>
    <Float n={3}><Chip x={290} y={70} s={70} fill={SKY} icon="shield" /></Float>
    <Float n={1}>
      <Blk x={36} y={232} w={96} h={72} r={16}>
        <circle cx="68" cy="268" r="16" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
        <Ic d={IC.clock} x={56} y={256} s={1} />
        <Bar x="92" y="260" w="28" fill="var(--acc)" /><Bar x="92" y="274" w="20" />
      </Blk>
    </Float>
    <Spark x={348} y={236} fill={AMB} /><Spark x={60} y={50} s={7} delay={1} />
  </>
);

const Offers = () => (
  <>
    <Back />
    <g transform="rotate(-8 200 190)">
      <Blk x={96} y={112} w={208} h={150} r={26} fill={AMB} sh={8}>
        <circle cx="128" cy="144" r="9" fill="var(--soft)" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="158" cy="168" r="17" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
        <circle cx="242" cy="214" r="17" fill="var(--card)" stroke="var(--ink)" strokeWidth="3.5" />
        <path d="M250 160L150 222" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" />
        <Bar x="122" y="240" w="90" h="8" fill="var(--ink)" />
      </Blk>
    </g>
    <Float n={2}>
      <Blk x={34} y={248} w={96} h={84} r={14} fill={ROS}>
        <rect x="34" y="248" width="96" height="26" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
        <rect x="74" y="248" width="16" height="84" fill="var(--card)" stroke="var(--ink)" strokeWidth="3" />
        <path d="M82 248c-16-22-34-14-26 -2 4 6 20 4 26 2zM82 248c16-22 34-14 26-2-4 6-20 4-26 2z" fill={AMB} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      </Blk>
    </Float>
    <Float n={3}>
      <Blk x={250} y={46} w={120} h={62} r={14}>
        <path d="M296 56V98" stroke="var(--ink)" strokeWidth="2.5" strokeDasharray="4 5" />
        <Bar x="264" y="70" w="22" h="8" fill="var(--acc)" /><Bar x="264" y="86" w="16" />
        <Bar x="308" y="66" w="48" h="9" fill="var(--ink)" /><Bar x="308" y="84" w="32" />
      </Blk>
    </Float>
    <Float n={1}><Chip x={290} y={266} s={64} fill={SKY} icon="bolt" is={1.9} iconFill={AMB} /></Float>
    <Spark x={64} y={120} /><Spark x={352} y={170} s={8} fill={VIO} delay={0.7} /><Spark x={170} y={50} s={6} fill={ROS} delay={1.5} />
  </>
);

const Shops = () => (
  <>
    <Back />
    <Blk x={88} y={172} w={224} h={142} r={6} sh={8} />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={80 + i * 48} y={124} width="48" height="50" fill={i % 2 ? 'var(--card)' : AMB} stroke="var(--ink)" strokeWidth="3" />
    ))}
    <Blk x={150} y={78} w={100} h={34} r={10} fill="var(--acc)" sh={4} sw={2.5}>
      <Bar x="166" y="91" w="68" h="8" fill="var(--ink)" />
    </Blk>
    <Blk x={104} y={198} w={62} h={52} r={6} fill={SKY} sh={0} sw={3} />
    <Blk x={236} y={198} w={62} h={52} r={6} fill={SKY} sh={0} sw={3} />
    <Blk x={178} y={232} w={50} h={82} r={6} fill="var(--acc)" sh={0} sw={3}>
      <circle cx="216" cy="276" r="3.5" fill="var(--ink)" />
    </Blk>
    <Float n={3}>
      <g>
        <path d="M336 160C312 134 306 120 306 106a30 30 0 0160 0c0 14-6 28-30 54z" fill="var(--ink)" transform="translate(6 6)" />
        <path d="M336 160C312 134 306 120 306 106a30 30 0 0160 0c0 14-6 28-30 54z" fill={ROS} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="336" cy="106" r="11" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
      </g>
    </Float>
    <Float n={2}>
      <Blk x={30} y={92} w={106} h={58} r={16}>
        <Stars x={40} y={102} n={4} />
        <Bar x="42" y="130" w="66" />
      </Blk>
    </Float>
    <Float n={1}><Chip x={290} y={262} s={66} fill={VIO} icon="shield" is={1.9} /></Float>
    <Spark x={52} y={236} /><Spark x={356} y={220} s={7} fill={AMB} delay={1} />
  </>
);

const Admin = () => (
  <>
    <Back />
    <Blk x={58} y={92} w={284} h={220} r={18} sh={8}>
      <rect x="58" y="92" width="62" height="220" rx="18" fill="var(--acc)" stroke="var(--ink)" strokeWidth="3" />
      <rect x="100" y="92" width="20" height="220" fill="var(--acc)" />
      <path d="M120 92V312" stroke="var(--ink)" strokeWidth="3" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x="72" y={112 + i * 34} width="34" height="12" rx="6" fill={i === 0 ? 'var(--card)' : 'var(--ink)'} opacity={i === 0 ? 1 : 0.55} />)}
      <Bar x="138" y="110" w="90" h="9" fill="var(--ink)" />
      {[[140, 60, SKY], [168, 94, 'var(--acc)'], [196, 74, AMB], [224, 120, VIO], [252, 90, ROS]].map(([x, h, f]) => (
        <rect key={x} x={x} y={290 - h} width="20" height={h} rx="4" fill={f} stroke="var(--ink)" strokeWidth="2.5" />
      ))}
      <path d="M142 190L176 160L206 172L238 130L312 120" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Blk>
    <Float n={2}>
      <Blk x={274} y={34} w={96} h={86} r={16}>
        <circle cx="322" cy="77" r="22" fill="none" stroke={AMB} strokeWidth="13" />
        <circle cx="322" cy="77" r="22" fill="none" stroke="var(--acc)" strokeWidth="13" strokeDasharray="60 80" transform="rotate(-90 322 77)" />
        <circle cx="322" cy="77" r="29" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="322" cy="77" r="15" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      </Blk>
    </Float>
    <Float n={3}>
      <Blk x={256} y={262} w={104} h={60} r={14} fill={AMB}>
        <Ic d={IC.bolt} x={270} y={272} s={1.7} fill="var(--card)" />
        <Bar x="304" y="280" w="44" h="9" fill="var(--ink)" /><Bar x="304" y="298" w="28" fill="var(--card)" />
      </Blk>
    </Float>
    <Spark x={40} y={70} /><Spark x={30} y={250} s={7} fill={VIO} delay={1.2} />
  </>
);

const SCENES = { home: Home, devices: Devices, track: Track, account: Account, repair: Repair, offers: Offers, shops: Shops, admin: Admin };

export const ART_BY_VARIANT = {
  home: 'home',
  devices: 'devices',
  category: 'devices',
  track: 'track',
  account: 'account',
  login: 'account',
  signup: 'account',
  repair: 'repair',
  offers: 'offers',
  shop: 'shops',
  shops: 'shops',
  shopPage: 'shops',
  admin: 'admin',
};

export const HeroArt = memo(({ type = 'home', darkMode = false, theme = null, className = 'h-full w-full' }) => {
  const Scene = SCENES[type] || Home;
  const style = useMemo(() => (theme ? themeStyle(theme) : darkMode ? THEME.dark : THEME.light), [theme, darkMode]);
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true" focusable="false">
      <Scene />
    </svg>
  );
});

export const FooterArt = memo(({ darkMode = false, className = 'h-full w-full' }) => (
  <svg viewBox="0 0 240 150" className={className} style={darkMode ? THEME.dark : THEME.light} aria-hidden="true" focusable="false">
    <circle cx="120" cy="78" r="62" fill="var(--soft)" />
    <ellipse cx="120" cy="140" rx="66" ry="6" fill="var(--ink)" opacity=".18" />
    <Float n={2}><Chip x={24} y={34} s={52} fill={AMB} icon="wrench" is={1.6} /></Float>
    <Float n={3}><Chip x={166} y={22} s={50} fill={SKY} icon="shield" is={1.5} /></Float>
    <Phone x={90} y={14} w={60} h={116} rot={-5} sh={5}>
      <rect x="98" y="34" width="44" height="26" rx="7" fill="var(--acc)" stroke="var(--ink)" strokeWidth="2" />
      <Bar x="98" y="70" w="44" h="5" /><Bar x="98" y="82" w="28" h="5" />
      <rect x="98" y="98" width="44" height="16" rx="6" fill={AMB} stroke="var(--ink)" strokeWidth="2" />
    </Phone>
    <Float n={1}>
      <Blk x={160} y={86} w={56} h={40} r={12} sh={4} sw={2.5} fill={VIO}>
        <Ic d={IC.bolt} x={173} y={92} s={1.2} fill={AMB} sw={2} />
      </Blk>
    </Float>
    <Spark x={20} y={110} s={7} /><Spark x={222} y={64} s={6} fill={ROS} delay={1} />
  </svg>
));

export default HeroArt;