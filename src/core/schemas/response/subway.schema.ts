import * as z from "zod";

// GET /api/subway — 드롭다운용 전체 역명 목록. SelectField가 기대하는 {value,label} shape 그대로 유지.
const subwayStationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const subwayStationsResponseSchema = z.array(subwayStationOptionSchema);

type SubwayStationsResponse = z.infer<typeof subwayStationsResponseSchema>;

// GET /api/subway/[station] — 특정 역이 지나는 노선 + 노선 컬러.
const subwayLineSchema = z.object({
  name: z.string(),
  color: z.string(),
});

const subwayStationLineInfoResponseSchema = z.object({
  station: z.string(),
  lines: z.array(subwayLineSchema),
});

type SubwayStationLineInfoResponse = z.infer<
  typeof subwayStationLineInfoResponseSchema
>;

export {
  subwayStationOptionSchema,
  subwayStationsResponseSchema,
  subwayLineSchema,
  subwayStationLineInfoResponseSchema,
  type SubwayStationsResponse,
  type SubwayStationLineInfoResponse,
};
