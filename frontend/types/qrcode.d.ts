declare module 'qrcode' {
  export interface QRCodeOptions {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    type?: 'png' | 'svg' | 'pdf' | 'eps'
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>
  export function toString(text: string, options?: QRCodeOptions & { type: 'svg' }): Promise<string>
}
