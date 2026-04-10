package streamscout;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(TmdbRateLimitException.class)
  public ResponseEntity<String> handleRateLimit(TmdbRateLimitException ex) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .header("Content-Type", "application/json")
        .body("{\"error\":\"Service temporarily unavailable, please try again\"}");
  }

  @ExceptionHandler({java.io.IOException.class, java.lang.InterruptedException.class})
  public ResponseEntity<String> handleGeneric(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .header("Content-Type", "application/json")
        .body("{\"error\":\"Internal server error\"}");
  }
}
