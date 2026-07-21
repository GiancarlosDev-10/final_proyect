import { ErrorDominio } from "@/compartido/dominio/errores";

export class FotoInvalidaError extends ErrorDominio {
  readonly codigo = "FOTO_INVALIDA";
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class EncodingInvalidoError extends ErrorDominio {
  readonly codigo = "ENCODING_INVALIDO";
  constructor() {
    super("El encoding debe ser un arreglo de 128 números.");
  }
}
