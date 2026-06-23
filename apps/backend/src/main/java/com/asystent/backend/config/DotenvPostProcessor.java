package com.asystent.backend.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.LinkedHashMap;
import java.util.Map;

@Order(Ordered.LOWEST_PRECEDENCE)
public class DotenvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // .env.local loads first (added last — lower priority)
        // .env loads second (added after systemEnvironment — higher priority than .env.local)
        // Both sit below OS environment variables
        Map<String, Object> envLocalProps = loadFile(".env.local");
        Map<String, Object> envProps      = loadFile(".env");

        if (!envLocalProps.isEmpty()) {
            addSource(environment, "dotenv-local", envLocalProps, false);
        }
        if (!envProps.isEmpty()) {
            // .env has higher priority: overrides placeholder values that may appear in .env.local
            addSource(environment, "dotenv", envProps, true);
        }
    }

    private void addSource(ConfigurableEnvironment env, String name,
                           Map<String, Object> props, boolean highPriority) {
        MapPropertySource source = new MapPropertySource(name, props);
        try {
            if (highPriority) {
                env.getPropertySources().addAfter(
                        StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, source);
            } else {
                env.getPropertySources().addLast(source);
            }
        } catch (IllegalArgumentException e) {
            // Source already present — skip
        }
    }

    private Map<String, Object> loadFile(String filename) {
        Map<String, Object> props = new LinkedHashMap<>();
        File f = new File(filename);
        if (!f.exists()) return props;

        try {
            for (String line : Files.readAllLines(f.toPath())) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq < 1) continue;
                String key   = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                // Skip placeholder values like <twój klucz>
                if (value.startsWith("<") && value.endsWith(">")) continue;
                props.put(key, value);
            }
        } catch (IOException ignored) {
        }
        return props;
    }
}
