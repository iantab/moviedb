package streamscout;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/tmdb")
public class TmdbProxyController {

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient httpClient;

    public TmdbProxyController(
            @Value("${tmdb.api-key}") String apiKey,
            @Value("${tmdb.base-url}") String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newHttpClient();
    }

    @GetMapping("/**")
    public ResponseEntity<String> proxy(HttpServletRequest request) throws Exception {
        String path = request.getRequestURI().substring("/api/tmdb".length());
        String query = request.getQueryString();

        String targetUrl = baseUrl + path;
        if (query != null && !query.isEmpty()) {
            targetUrl += "?" + query;
        }

        HttpRequest tmdbRequest = HttpRequest.newBuilder()
                .uri(URI.create(targetUrl))
                .header("Authorization", "Bearer " + apiKey)
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> tmdbResponse = httpClient.send(tmdbRequest, HttpResponse.BodyHandlers.ofString());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        return ResponseEntity
                .status(tmdbResponse.statusCode())
                .headers(headers)
                .body(tmdbResponse.body());
    }
}
