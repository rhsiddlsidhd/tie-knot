import "client-only";

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Geolocation 경계 — 권한 프롬프트가 걸려 있어 결과가 환경마다 다르고,
 * 콜백 API라 호출자가 매번 Promise로 감싸야 했다.
 *
 * 거부·실패는 throw하지 않고 null로 떨어뜨린다 — 위치는 있으면 좋은 정보지
 * 없으면 화면이 못 뜨는 값이 아니라서, 호출자가 try/catch 대신 분기만 하면 된다.
 */
export const getCurrentCoordinates = (): Promise<Coordinates | null> =>
  new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => {
        console.error(error);
        resolve(null);
      },
    );
  });
