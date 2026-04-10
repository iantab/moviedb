package streamscout;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
public class TmdbService {

  private final String apiKey;
  private final String baseUrl;
  private final HttpClient httpClient;

  public TmdbService(
      @Value("${tmdb.api-key}") String apiKey,
      @Value("${tmdb.base-url}") String baseUrl,
      HttpClient httpClient) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.httpClient = httpClient;
  }

  @Cacheable(value = "trending", key = "#mediaType")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse getTrending(String mediaType) throws Exception {
    return fetch("/trending/" + mediaType + "/week", null);
  }

  @Cacheable(value = "popular", key = "#mediaType")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse getPopular(String mediaType) throws Exception {
    return fetch("/" + mediaType + "/popular", null);
  }

  @Cacheable(value = "search", key = "#mediaType + ':' + #query")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse search(String mediaType, String query) throws Exception {
    String endpoint = "/search/" + mediaType;
    String queryString =
        "query="
            + java.net.URLEncoder.encode(query, "UTF-8")
            + "&include_adult=false&language=en-US&page=1";
    return fetch(endpoint, queryString);
  }

  @Cacheable(value = "discover", key = "#mediaType + ':' + #providerId + ':' + #region")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse discover(String mediaType, int providerId, String region) throws Exception {
    String endpoint = "/discover/" + mediaType;
    String queryString =
        "with_watch_providers="
            + providerId
            + "&watch_region="
            + java.net.URLEncoder.encode(region, "UTF-8")
            + "&sort_by=popularity.desc";
    return fetch(endpoint, queryString);
  }

  @Cacheable(value = "providers", key = "#mediaType + ':' + #mediaId")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse getWatchProviders(String mediaType, int mediaId) throws Exception {
    return fetch("/" + mediaType + "/" + mediaId + "/watch/providers", null);
  }

  @Cacheable(value = "recommendations", key = "#mediaType + ':' + #mediaId")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse getRecommendations(String mediaType, int mediaId) throws Exception {
    return fetch("/" + mediaType + "/" + mediaId + "/recommendations", null);
  }

  @Cacheable(value = "details", key = "#mediaType + ':' + #mediaId")
  @Retryable(
      retryFor = TmdbRateLimitException.class,
      maxAttempts = 4,
      backoff = @Backoff(delay = 1000, multiplier = 2))
  public TmdbResponse getDetails(String mediaType, int mediaId) throws Exception {
    return fetch("/" + mediaType + "/" + mediaId, null);
  }

  private TmdbResponse fetch(String path, String queryString) throws Exception {
    String targetUrl = baseUrl + path;
    if (queryString != null && !queryString.isEmpty()) {
      targetUrl += "?" + queryString;
    }

    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(targetUrl))
            .header("Authorization", "Bearer " + apiKey)
            .header("Accept", "application/json")
            .GET()
            .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() == 429) {
      throw new TmdbRateLimitException("TMDB rate limit exceeded");
    }

    return new TmdbResponse(response.statusCode(), response.body());
  }

  public record TmdbResponse(int statusCode, String body) {}
}
