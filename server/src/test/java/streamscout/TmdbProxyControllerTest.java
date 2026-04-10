package streamscout;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TmdbProxyController.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TmdbProxyControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private TmdbService tmdbService;

  private static final String JSON_BODY = "{\"results\":[]}";

  @Test
  void trendingReturns200() throws Exception {
    when(tmdbService.getTrending("movie")).thenReturn(new TmdbService.TmdbResponse(200, JSON_BODY));

    mockMvc
        .perform(get("/api/tmdb/trending/movie/week"))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "application/json"))
        .andExpect(content().string(JSON_BODY));
  }

  @Test
  void popularReturns200() throws Exception {
    when(tmdbService.getPopular("movie")).thenReturn(new TmdbService.TmdbResponse(200, JSON_BODY));

    mockMvc
        .perform(get("/api/tmdb/movie/popular"))
        .andExpect(status().isOk())
        .andExpect(content().string(JSON_BODY));
  }

  @Test
  void searchReturns200() throws Exception {
    when(tmdbService.search("movie", "test"))
        .thenReturn(new TmdbService.TmdbResponse(200, JSON_BODY));

    mockMvc
        .perform(get("/api/tmdb/search/movie").param("query", "test"))
        .andExpect(status().isOk())
        .andExpect(content().string(JSON_BODY));
  }

  @Test
  void discoverReturns200() throws Exception {
    when(tmdbService.discover("movie", 8, "US"))
        .thenReturn(new TmdbService.TmdbResponse(200, JSON_BODY));

    mockMvc
        .perform(
            get("/api/tmdb/discover/movie")
                .param("with_watch_providers", "8")
                .param("watch_region", "US"))
        .andExpect(status().isOk())
        .andExpect(content().string(JSON_BODY));
  }

  @Test
  void watchProvidersReturns200() throws Exception {
    when(tmdbService.getWatchProviders("movie", 123))
        .thenReturn(new TmdbService.TmdbResponse(200, JSON_BODY));

    mockMvc
        .perform(get("/api/tmdb/movie/123/watch/providers"))
        .andExpect(status().isOk())
        .andExpect(content().string(JSON_BODY));
  }

  @Test
  void forwardsUpstreamErrorStatus() throws Exception {
    when(tmdbService.getTrending("movie"))
        .thenReturn(new TmdbService.TmdbResponse(404, "{\"status_message\":\"not found\"}"));

    mockMvc
        .perform(get("/api/tmdb/trending/movie/week"))
        .andExpect(status().isNotFound())
        .andExpect(content().string("{\"status_message\":\"not found\"}"));
  }

  @Test
  void searchWithoutQueryReturns400() throws Exception {
    mockMvc.perform(get("/api/tmdb/search/movie")).andExpect(status().isBadRequest());
  }

  @Test
  void discoverWithoutRequiredParamsReturns400() throws Exception {
    mockMvc.perform(get("/api/tmdb/discover/movie")).andExpect(status().isBadRequest());
  }

  @Test
  @Order(Integer.MAX_VALUE)
  void rateLimitReturns429WhenBucketExhausted() throws Exception {
    when(tmdbService.getTrending("movie")).thenReturn(new TmdbService.TmdbResponse(200, JSON_BODY));

    boolean got429 = false;
    for (int i = 0; i < 50; i++) {
      int status =
          mockMvc
              .perform(get("/api/tmdb/trending/movie/week"))
              .andReturn()
              .getResponse()
              .getStatus();
      if (status == 429) {
        got429 = true;
        break;
      }
    }

    assert got429 : "Expected at least one 429 response after exhausting the rate limit bucket";
  }
}
