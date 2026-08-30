/** A single executed contract, normalized into the shape your algo actually wants. */
export interface Trade {
  timestamp: number; // epoch ms
  symbol: string;
  buyer: number; // buyer broker/member id
  seller: number; // seller broker/member id
  quantity: number;
  price: number;
  amount: number;
  // Extra context kept around in case you need it, but never required:
  name?: string;
  buyerBroker?: string;
  sellerBroker?: string;
  contractId?: number;
}

export interface Candle {
  time: number; // bucket start, epoch ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// --- raw shapes from the source API (internal, not exported) ---
export interface RawFloorsheetTrade {
  symbol: string;
  name: string;
  buyerMemberId: string;
  sellerMemberId: string;
  contractId: number;
  contractQuantity: number;
  contractRate: number;
  contractAmount: number;
  businessDate: string;
  buyerBrokerName: string;
  sellerBrokerName: string;
  tradeTime: string;
}

export interface RawFloorsheetPage {
  totalAmount: number;
  totalQty: number;
  totalTrades: number;
  pageIndex: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  content: RawFloorsheetTrade[];
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface RawFloorsheetResponse {
  success: boolean;
  code: string | null;
  message: string | null;
  data: RawFloorsheetPage;
}
