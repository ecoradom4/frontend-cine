export type SeatStatus = "available" | "occupied" | "selected" | "maintenance"

export type SeatType = "standard" | "premium" | "vip"

export interface Seat {
  id: string
  row: string
  number: number
  type: SeatType
  status: SeatStatus
}