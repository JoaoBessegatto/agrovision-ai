package com.agrovisionai.agrovision_ai.controller;

import com.agrovisionai.agrovision_ai.domain.dto.request.ProdutorRequestDTO;
import com.agrovisionai.agrovision_ai.domain.dto.response.ProdutorResponseDTO;
import com.agrovisionai.agrovision_ai.exception.GlobalExceptionHandler;
import com.agrovisionai.agrovision_ai.service.ProdutorService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProdutorAuthorizationTest {
    private AnnotationConfigApplicationContext context;
    private StubProdutorService service;
    private MockMvc mvc;
    private static final String DADOS = """
            {"nomeCompleto":"Produtor de Teste","cpfOrCnpj":"00000000000",
             "dataNascimento":"1990-01-01","telefone":"18999999999"}
            """;

    @BeforeEach
    void preparar() {
        context = new AnnotationConfigApplicationContext(TestConfig.class);
        service = context.getBean(StubProdutorService.class);
        mvc = MockMvcBuilders.standaloneSetup(context.getBean(ProdutorController.class))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        autenticar("USER");
    }

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
        context.close();
    }

    private void autenticar(String role) {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("teste", null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    @Test
    void usuarioComRoleUserPodeConcluirCadastro() throws Exception {
        mvc.perform(post("/api/produtor").contentType(MediaType.APPLICATION_JSON).content(DADOS))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nomeCompleto").value("Produtor de Teste"));
        assertEquals(1, service.chamadas);
    }

    @Test
    void usuarioPodeConsultarAtualizarEExcluirSeuPerfil() throws Exception {
        mvc.perform(get("/api/produtor/me")).andExpect(status().isOk());
        mvc.perform(put("/api/produtor").contentType(MediaType.APPLICATION_JSON).content(DADOS))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/produtor")).andExpect(status().isNoContent());
        assertEquals(3, service.chamadas);
    }

    @Test
    void listagemGeralContinuaProibidaParaUserERetorna403EmVezDe500() throws Exception {
        mvc.perform(get("/api/produtor"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Você não tem permissão para realizar esta operação."));
        assertEquals(0, service.chamadas);
    }

    @Test
    void administradorPodeListarProdutores() throws Exception {
        autenticar("ADMIN");
        mvc.perform(get("/api/produtor")).andExpect(status().isOk());
        assertEquals(1, service.chamadas);
    }

    @Test
    void metodoDeCadastroNaoPermiteUsuarioAnonimo() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "teste", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
        mvc.perform(post("/api/produtor").contentType(MediaType.APPLICATION_JSON).content(DADOS))
                .andExpect(status().isForbidden());
        assertEquals(0, service.chamadas);
    }

    @Configuration
    @EnableMethodSecurity
    static class TestConfig {
        @Bean StubProdutorService produtorService() { return new StubProdutorService(); }
        @Bean ProdutorController produtorController(StubProdutorService service) {
            return new ProdutorController(service);
        }
    }

    static class StubProdutorService extends ProdutorService {
        int chamadas;
        StubProdutorService() { super(null, null); }
        private ProdutorResponseDTO resposta() {
            chamadas++;
            return new ProdutorResponseDTO("00000000000", "Produtor de Teste",
                    LocalDate.of(1990, 1, 1), "18999999999");
        }
        @Override public ProdutorResponseDTO cadastrar(ProdutorRequestDTO dto) { return resposta(); }
        @Override public ProdutorResponseDTO atualizar(ProdutorRequestDTO dto) { return resposta(); }
        @Override public ProdutorResponseDTO findMe() { return resposta(); }
        @Override public boolean deletar() { chamadas++; return true; }
        @Override public List<ProdutorResponseDTO> findAll() { return List.of(resposta()); }
    }
}
