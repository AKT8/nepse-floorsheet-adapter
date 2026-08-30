/** A single executed contract, normalized into the shape your algo actually wants. */
export interface Trade {
    timestamp: number;
    symbol: string;
    buyer: number;
    seller: number;
    quantity: number;
    price: number;
    amount: number;
    name?: string;
    buyerBroker?: string;
    sellerBroker?: string;
    contractId?: number;
}
export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
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
