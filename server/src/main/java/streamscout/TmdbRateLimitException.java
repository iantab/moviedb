package streamscout;

public class TmdbRateLimitException extends RuntimeException {
  public TmdbRateLimitException(String message) {
    super(message);
  }
}
