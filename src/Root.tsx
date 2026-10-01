import "./index.css";
import { Composition } from "remotion";
import { DiamaconAccountex } from "./diamacon/DiamaconAccountex";
import { BrandTest } from "./diamacon/BrandTest";
import { DiamagesBrandTest } from "./diamages/BrandTest";
import { SistemaSolar } from "./comeralia/SistemaSolar";
import { DURATION as PORTAL_DURATION, FPS as PORTAL_FPS, PortalNominas } from "./portal/PortalNominas";
import { DURATION as PORTAL2_DURATION, PortalNominasV2 } from "./portal/PortalNominasV2";
import { DURATION as PORTAL3_DURATION, PortalNominasV3 } from "./portal/PortalNominasV3";
import { FPS as SOLAR_FPS, FRAMES as SOLAR_FRAMES } from "./comeralia/timeline";
import { DiamagesAccountex } from "./diamages/DiamagesAccountex";
import { DURATION_FRAMES as DIAMAGES_FRAMES } from "./diamages/theme";
import {
  DURATION as TUNEL_DURATION,
  FONDO_LOOP,
  TunelFondo,
  TunelPalabras,
} from "./tunel/TunelPalabras";
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from "./diamacon/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DiamaconAccountex"
        component={DiamaconAccountex}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="BrandTest"
        component={BrandTest}
        durationInFrames={1}
        fps={FPS}
        width={WIDTH}
        height={1200}
      />
      <Composition
        id="DiamagesAccountex"
        component={DiamagesAccountex}
        durationInFrames={DIAMAGES_FRAMES}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="ComeraliaSistemaSolar"
        component={SistemaSolar}
        durationInFrames={SOLAR_FRAMES}
        fps={SOLAR_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PortalNominas"
        component={PortalNominas}
        durationInFrames={PORTAL_DURATION * PORTAL_FPS}
        fps={PORTAL_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PortalNominasV2"
        component={PortalNominasV2}
        durationInFrames={Math.round(PORTAL2_DURATION * PORTAL_FPS)}
        fps={PORTAL_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PortalNominasV3"
        component={PortalNominasV3}
        durationInFrames={Math.round(PORTAL3_DURATION * PORTAL_FPS)}
        fps={PORTAL_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="DiamagesBrandTest"
        component={DiamagesBrandTest}
        durationInFrames={1}
        fps={60}
        width={1920}
        height={1130}
      />
      <Composition
        id="TunelPalabras"
        component={TunelPalabras}
        durationInFrames={Math.round(TUNEL_DURATION * 60)}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="TunelFondo"
        component={TunelFondo}
        durationInFrames={FONDO_LOOP * 60}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ particulas: false }}
      />
      <Composition
        id="TunelFondoParticulas"
        component={TunelFondo}
        durationInFrames={FONDO_LOOP * 60}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ particulas: true }}
      />
    </>
  );
};
