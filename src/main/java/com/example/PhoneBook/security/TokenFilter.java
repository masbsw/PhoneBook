package com.example.PhoneBook.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class TokenFilter extends OncePerRequestFilter {

    private final JwtCore jwtCore;
    private final UserDetailsService userDetailsService;
    private final Map<String, UserDetails> userCache = new ConcurrentHashMap<>();

    @Autowired
    public TokenFilter(JwtCore jwtCore, UserDetailsService userDetailsService) {
        this.jwtCore = jwtCore;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // Пропускаем статические файлы и публичные эндпоинты без проверки токена
        if (shouldSkipAuthentication(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = extractJwtFromRequest(request);

        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String username = jwtCore.getNameFromJwt(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                authenticateUser(request, jwt, username);
            }

        } catch (ExpiredJwtException e) {
            // Токен просрочен
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Token expired\", \"message\": \"Please login again\"}");
            return;
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}");
            // Не очищаем SecurityContext для других ошибок, чтобы не прерывать цепочку
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldSkipAuthentication(String path) {
        // Публичные пути, не требующие аутентификации
        return path.startsWith("/js/") ||
                path.equals("/") ||
                path.equals("/index.html") ||
                path.equals("/phonebook.html") ||
                path.equals("/phonebook") ||
                path.equals("/admin.html") ||
                path.equals("/admin") ||
                path.equals("/users.html") ||
                path.equals("/users") ||
                path.startsWith("/auth/") ||
                path.equals("/favicon.ico") ||
                path.equals("/styles.css");
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void authenticateUser(HttpServletRequest request, String jwt, String username) {
        try {
            // Проверяем кэш пользователей
            UserDetails userDetails = userCache.get(username);

            if (userDetails == null) {
                userDetails = userDetailsService.loadUserByUsername(username);
                userCache.put(username, userDetails);
            }

            // Получаем роли из токена
            List<String> rolesFromToken = jwtCore.getRolesFromJwt(jwt);

            // Создаем authorities из ролей в токене
            List<GrantedAuthority> authorities = rolesFromToken.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            logger.debug("User {} authenticated with roles: {}");

        } catch (Exception e) {
            logger.error("Failed to authenticate user {}: {}");
            // Удаляем из кэша при ошибке
            userCache.remove(username);
            throw e;
        }
    }

    // Метод для очистки кэша (может быть полезен)
    public void clearUserCache() {
        userCache.clear();
    }

    // Метод для удаления конкретного пользователя из кэша
    public void removeUserFromCache(String username) {
        userCache.remove(username);
    }
}