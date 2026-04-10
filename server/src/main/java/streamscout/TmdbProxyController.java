package streamscout;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tmdb")
public class TmdbProxyController {

  private final TmdbService tmdbService;
  private final Bucket bucket;

  public TmdbProxyController(TmdbService tmdbService) {
    this.tmdbService = tmdbService;
    this.bucket = Bucket.builder().addLimit(Bandwidth.simple(40, Duration.ofSeconds(1))).build();
  }

  @GetMapping("/trending/{mediaType}/week")
  public ResponseEntity<String> trending(@PathVariable String mediaType) throws Exception {
    if (!bucket.tryConsume(1)) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    TmdbService.TmdbResponse response = tmdbService.getTrending(mediaType);
    return toResponseEntity(response);
  }

  @GetMapping("/{mediaType}/popular")
  public ResponseEntity<String> popular(@PathVariable String mediaType) throws Exception {
    if (!bucket.tryConsume(1)) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    TmdbService.TmdbResponse response = tmdbService.getPopular(mediaType);
    return toResponseEntity(response);
  }

  @GetMapping("/search/{mediaType}")
  public ResponseEntity<String> search(@PathVariable String mediaType, @RequestParam String query)
      throws Exception {
    if (!bucket.tryConsume(1)) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    TmdbService.TmdbResponse response = tmdbService.search(mediaType, query);
    return toResponseEntity(response);
  }

  @GetMapping("/discover/{mediaType}")
  public ResponseEntity<String> discover(
      @PathVariable String mediaType,
      @RequestParam("with_watch_providers") int providerId,
      @RequestParam("watch_region") String region)
      throws Exception {
    if (!bucket.tryConsume(1)) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    TmdbService.TmdbResponse response = tmdbService.discover(mediaType, providerId, region);
    return toResponseEntity(response);
  }

  @GetMapping("/{mediaType}/{mediaId}/watch/providers")
  public ResponseEntity<String> watchProviders(
      @PathVariable String mediaType, @PathVariable int mediaId) throws Exception {
    if (!bucket.tryConsume(1)) {
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    TmdbService.TmdbResponse response = tmdbService.getWatchProviders(mediaType, mediaId);
    return toResponseEntity(response);
  }

  private ResponseEntity<String> toResponseEntity(TmdbService.TmdbResponse response) {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Content-Type", "application/json");
    return ResponseEntity.status(response.statusCode()).headers(headers).body(response.body());
  }
}
