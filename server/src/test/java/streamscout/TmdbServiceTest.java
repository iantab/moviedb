package streamscout;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

@SuppressWarnings("unchecked")
class TmdbServiceTest {

  private HttpClient httpClient;
  private TmdbService tmdbService;

  private static final String API_KEY = "test-key";
  private static final String BASE_URL = "https://api.example.com/3";

  @BeforeEach
  void setUp() {
    httpClient = mock(HttpClient.class);
    tmdbService = new TmdbService(API_KEY, BASE_URL, httpClient);
  }

  private HttpResponse<String> mockResponse(int statusCode, String body) throws Exception {
    HttpResponse<String> response = mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(statusCode);
    when(response.body()).thenReturn(body);
    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(response);
    return response;
  }

  private HttpRequest captureRequest() throws Exception {
    ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
    verify(httpClient).send(captor.capture(), any(HttpResponse.BodyHandler.class));
    return captor.getValue();
  }

  @Test
  void getTrendingReturnsResponse() throws Exception {
    mockResponse(200, "{\"results\":[]}");

    TmdbService.TmdbResponse result = tmdbService.getTrending("movie");

    assertEquals(200, result.statusCode());
    assertEquals("{\"results\":[]}", result.body());
  }

  @Test
  void getTrendingBuildsCorrectUrl() throws Exception {
    mockResponse(200, "{}");

    tmdbService.getTrending("movie");

    HttpRequest request = captureRequest();
    assertEquals(BASE_URL + "/trending/movie/week", request.uri().toString());
  }

  @Test
  void getPopularBuildsCorrectUrl() throws Exception {
    mockResponse(200, "{}");

    tmdbService.getPopular("tv");

    HttpRequest request = captureRequest();
    assertEquals(BASE_URL + "/tv/popular", request.uri().toString());
  }

  @Test
  void searchBuildsCorrectUrl() throws Exception {
    mockResponse(200, "{}");

    tmdbService.search("movie", "the matrix");

    HttpRequest request = captureRequest();
    String uri = request.uri().toString();
    assertEquals(
        BASE_URL + "/search/movie?query=the+matrix&include_adult=false&language=en-US&page=1", uri);
  }

  @Test
  void discoverBuildsCorrectUrl() throws Exception {
    mockResponse(200, "{}");

    tmdbService.discover("movie", 8, "US");

    HttpRequest request = captureRequest();
    assertEquals(
        BASE_URL + "/discover/movie?with_watch_providers=8&watch_region=US&sort_by=popularity.desc",
        request.uri().toString());
  }

  @Test
  void getWatchProvidersBuildsCorrectUrl() throws Exception {
    mockResponse(200, "{}");

    tmdbService.getWatchProviders("movie", 550);

    HttpRequest request = captureRequest();
    assertEquals(BASE_URL + "/movie/550/watch/providers", request.uri().toString());
  }

  @Test
  void requestIncludesAuthorizationHeader() throws Exception {
    mockResponse(200, "{}");

    tmdbService.getTrending("movie");

    HttpRequest request = captureRequest();
    assertEquals("Bearer " + API_KEY, request.headers().firstValue("Authorization").orElse(null));
    assertEquals("application/json", request.headers().firstValue("Accept").orElse(null));
  }

  @Test
  void throws429AsTmdbRateLimitException() throws Exception {
    mockResponse(429, "rate limited");

    assertThrows(TmdbRateLimitException.class, () -> tmdbService.getTrending("movie"));
  }

  @Test
  void nonRateLimitErrorsPassThrough() throws Exception {
    mockResponse(500, "{\"error\":\"internal\"}");

    TmdbService.TmdbResponse result = tmdbService.getTrending("movie");

    assertEquals(500, result.statusCode());
    assertEquals("{\"error\":\"internal\"}", result.body());
  }
}
