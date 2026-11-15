package com.agrovisionai.agrovision_ai.service;

import com.agrovisionai.agrovision_ai.domain.entity.ConviteFuncionario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ConviteFuncionarioEmailService {

    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String remetente;

    public ConviteFuncionarioEmailService(
            JavaMailSender mailSender,
            @Value("${app.frontend.url:http://localhost:4200}") String frontendUrl,
            @Value("${app.mail.from:no-reply@agrovision.local}") String remetente
    ) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.remetente = remetente;
    }

    public void enviar(ConviteFuncionario convite, String token) {
        String link = frontendUrl + "/convite-funcionario?token=" + token;

        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(convite.getEmail());
        mensagem.setSubject("Convite para acessar a " + convite.getFazenda().getNome() + " no AgroVision");
        mensagem.setText(
                "Você foi convidado para acessar a fazenda "
                        + convite.getFazenda().getNome()
                        + " no AgroVision AI como "
                        + convite.getCargo().name()
                        + ".\n\n"
                        + "Acesse o link para aceitar o convite:\n"
                        + link
                        + "\n\n"
                        + "O convite expira em "
                        + convite.getExpiraEm()
                        + ".\n\n"
                        + "Se você não esperava este convite, ignore esta mensagem."
        );

        mailSender.send(mensagem);
    }
}
