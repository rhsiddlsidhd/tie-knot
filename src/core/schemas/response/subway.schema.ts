import * as z from "zod";

// GET /api/subway — 드롭다운용 전체 역명 목록. SelectField가 기대하는 {value,label} shape 그대로 유지.
const SubwayStationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const SubwayStationsResponseSchema = z.array(SubwayStationOptionSchema);

type SubwayStationsResponse = z.infer<typeof SubwayStationsResponseSchema>;

// GET /api/subway/[station] — 특정 역이 지나는 노선 + 노선 컬러.
const SubwayLineSchema = z.object({
  name: z.string(),
  color: z.string(),
});

const SubwayStationLineInfoResponseSchema = z.object({
  station: z.string(),
  lines: z.array(SubwayLineSchema),
});

type SubwayStationLineInfoResponse = z.infer<
  typeof SubwayStationLineInfoResponseSchema
>;

export {
  SubwayStationOptionSchema,
  SubwayStationsResponseSchema,
  SubwayLineSchema,
  SubwayStationLineInfoResponseSchema,
  type SubwayStationsResponse,
  type SubwayStationLineInfoResponse,
};
