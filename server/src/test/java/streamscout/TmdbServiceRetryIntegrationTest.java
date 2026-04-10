package streamscout;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@SuppressWarnings("unchecked")
class TmdbServiceRetryIntegrationTest {

  @Autowired private TmdbService tmdbService;

  @MockitoBean private HttpClient httpClient;

  private HttpResponse<String> createResponse(int statusCode, String body) {
    HttpResponse<String> response =
        (HttpResponse<String>) org.mockito.Mockito.mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(statusCode);
    when(response.body()).thenReturn(body);
    return response;
  }

  @Test
  void retriesOnRateLimitThenSucceeds() throws Exception {
    HttpResponse<String> rateLimited = createResponse(429, "rate limited");
    HttpResponse<String> success = createResponse(200, "{\"results\":[]}");

    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(rateLimited)
        .thenReturn(rateLimited)
        .thenReturn(success);

    TmdbService.TmdbResponse result = tmdbService.getTrending("movie");

    assertEquals(200, result.statusCode());
    verify(httpClient, times(3)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
  }

  @Test
  void throwsAfterExhaustingRetries() throws Exception {
    HttpResponse<String> rateLimited = createResponse(429, "rate limited");

    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(rateLimited);

    assertThrows(TmdbRateLimitException.class, () -> tmdbService.getTrending("movie"));
    verify(httpClient, times(4)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
  }

  @Test
  void cachePreventsDuplicateFetches() throws Exception {
    HttpResponse<String> success = createResponse(200, "{\"results\":[]}");

    when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(success);

    tmdbService.getPopular("movie");
    tmdbService.getPopular("movie");

    verify(httpClient, times(1)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
  }
}
