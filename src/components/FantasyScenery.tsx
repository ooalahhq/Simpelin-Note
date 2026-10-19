/** Decorative SVG scenery; static while the editor is idle. */
export default function FantasyScenery() {
  const distant = Array.from({ length: 22 }, (_, i) => ({
    x: i * 74 - 40,
    y: 355 + ((i * 37) % 110),
    scale: 0.8 + (i % 4) * 0.17,
  }));
  const near = [
    { x: 20, y: 460, scale: 2.4 },
    { x: 115, y: 555, scale: 1.7 },
    { x: 1290, y: 490, scale: 2.1 },
    { x: 1410, y: 570, scale: 2.9 },
  ];
  return (
    <div className="fantasy-scenery" aria-hidden="true">
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
      >
        <defs>
          <linearGradient id="fantasy-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--scene-sky-top)" />
            <stop offset="1" stopColor="var(--scene-sky-bottom)" />
          </linearGradient>
          <g id="fantasy-fir">
            <path d="M-3 0H3V-102H-3Z" fill="var(--scene-trunk)" />
            <path d="M0-134h5v12h5v12h7v12h-5v7h12v10h9v11H20v7h20v12h9v10H29v8h26v13h12v12H-61v-12h10v-13h22v-8h-18v-10h10v-12h18v-7h-13v-11h9v-10h12v-7h-5v-12h7v-12h5v-12Z" />
          </g>
        </defs>
        <path fill="url(#fantasy-sky)" d="M0 0h1440v900H0z" />
        <g fill="var(--scene-star)">
          {Array.from({ length: 32 }, (_, i) => (
            <path
              key={i}
              opacity={0.2 + (i % 3) * 0.13}
              d={`M${(i * 173 + 101) % 1440} ${(i * 47 + 38) % 280}h${i % 5 === 0 ? 4 : 2}v2h-2v${i % 5 === 0 ? 3 : 0}h-2z`}
            />
          ))}
        </g>
        <path
          fill="var(--scene-moon)"
          d="M1100 90h24V78h36v12h16v16h12v36h-12v16h-16v12h-36v-12h-24v-16h-12v-36h12z"
        />
        <path
          fill="var(--scene-sky-top)"
          d="M1143 80h20v12h16v17h11v31h-20v10h-22v-12h-16v-38h11z"
        />
        <path
          fill="var(--scene-ridge-far)"
          d="M0 343h40v-24h35v-29h38v-39h32v-28h30v-26h33v34h31v23h36v-14h27v-42h37v-35h24v-26h26v33h29v38h36v-20h35v-35h40v34h28v28h42v29h37v-20h40v-24h40v-33h35v-25h36v-22h32v27h34v36h38v-21h37v-28h37v-31h38v28h28v37h42v31h33v33h35v-14h40v-39h39v-27h38v-35h30v-19h32v25h26v28h37v23h35v27h42v271H0Z"
        />
        <path
          fill="var(--scene-ridge-mid)"
          d="M0 421h68v-24h72v-23h72v20h70v-34h82v20h70v34h77v-13h91v-33h82v-29h70v17h82v-35h75v27h69v39h91v-20h86v37h76v-11h79v-38h80v36h70v32h50v325H0z"
        />
        <g fill="var(--scene-ruin)">
          <path d="M859 349v-95h7v-18h6v-12h10v12h6v18h8v95zm-8-95h52v9h-52zm14-43h24v9h-24z" />
          <path d="M899 349v-60h6v-13h7v-22h7v22h7v13h7v60zM827 349v-42h8v-12h8v54z" />
          <path d="M840 334h92v17h-92z" />
        </g>
        <g fill="var(--scene-window)">
          <path d="M874 268h5v10h-5zm0 27h5v10h-5zm38 10h5v8h-5z" />
        </g>
        <path
          fill="var(--scene-mist)"
          opacity=".28"
          d="M0 419h140v-9h180v7h221v-8h170v11h198v-6h180v10h351v22H0z"
        />
        <g fill="var(--scene-tree-far)" opacity=".8">
          {distant.map((t, i) => (
            <use
              key={i}
              href="#fantasy-fir"
              transform={`translate(${t.x} ${t.y}) scale(${t.scale})`}
            />
          ))}
        </g>
        <path fill="var(--scene-water)" d="M0 563h1440v337H0z" />
        <g fill="var(--scene-mist)" opacity=".18">
          <path d="M570 572h310v3H570zm-82 24h428v3H488zm-71 29h567v2H417zm-42 39h660v3H375z" />
        </g>
        <g fill="var(--scene-tree-near)">
          {near.map((t, i) => (
            <use
              key={i}
              href="#fantasy-fir"
              transform={`translate(${t.x} ${t.y}) scale(${t.scale})`}
            />
          ))}
        </g>
        <path
          fill="var(--scene-ground)"
          d="M0 754h74v-16h92v12h90v24h136v-10h138v16h170v-7h180v-16h178v14h130v-29h122v13h130v145H0z"
        />
        <g fill="var(--scene-grass)">
          {Array.from({ length: 25 }, (_, i) => (
            <path
              key={i}
              d={`M${(i * 79) % 1440} ${750 + ((i * 17) % 70)}v-12h3v7h5v-15h3v22z`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
