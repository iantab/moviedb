package streamscout;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager();
    manager.setAllowNullValues(false);
    manager.registerCustomCache("trending", buildCache(Duration.ofHours(1)));
    manager.registerCustomCache("popular", buildCache(Duration.ofHours(4)));
    manager.registerCustomCache("search", buildCache(Duration.ofMinutes(30)));
    manager.registerCustomCache("providers", buildCache(Duration.ofHours(24)));
    manager.registerCustomCache("discover", buildCache(Duration.ofHours(2)));
    manager.registerCustomCache("recommendations", buildCache(Duration.ofHours(2)));
    manager.registerCustomCache("details", buildCache(Duration.ofHours(4)));
    return manager;
  }

  private com.github.benmanes.caffeine.cache.Cache<Object, Object> buildCache(Duration ttl) {
    return Caffeine.newBuilder().expireAfterWrite(ttl).maximumSize(1000).build();
  }
}
