class AdrIsFileError extends Error {
  constructor(message = "'./adr' exists but is not a directory") {
    super(message);
    this.name = "AdrIsFileError";
  }
}

export const AdlErrors = {
  AdrIsFile: AdrIsFileError,
};
