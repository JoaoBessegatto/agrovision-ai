#!/usr/bin/env python3
"""Verifica HTTP; --write-test-data cria registros somente em uma copia de teste."""
import argparse
import json
import secrets
import time
import urllib.error
import urllib.request
import uuid

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://localhost:4200')
parser.add_argument('--mailpit', default='http://localhost:8025')
parser.add_argument('--write-test-data', action='store_true')
args = parser.parse_args()


def request(path, *, data=None, token=None, expected=(200,), base=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(
        (base or args.url) + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers=headers,
    )
    try:
        response = urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        status = response.code
        body = response.read().decode()
        assert status in expected, f'{path}: HTTP {status}, esperado {expected}'
        return body, response.headers


for route in ['/', '/app/fazenda/area']:
    body, _ = request(route)
    assert '<app-root' in body, f'SPA nao servida em {route}'

config, headers = request('/runtime-config.js')
assert 'AGROVISION_CONFIG' in config and '${MAP' not in config
assert 'no-store' in headers.get('Cache-Control', '')
worker, headers = request('/assets/mapbox/mapbox-gl-csp-worker.js')
assert len(worker) > 100_000 and '<app-root' not in worker, 'Worker do Mapbox ausente'
assert 'no-cache' in headers.get('Cache-Control', ''), 'Worker deve revalidar apos atualizacao'
request('/api/me/context', expected=(401, 403))
request('/api/auth/login', data={'email': 'inexistente@example.invalid', 'password': 'invalid'}, expected=(401,))
request('/readyz', base=args.mailpit)

if args.write_test_data:
    unique = uuid.uuid4().hex
    email = f'smoke-{unique}@example.invalid'
    password = secrets.token_urlsafe(24)
    request('/api/auth/cadastrar', data={'name': 'Teste Docker', 'email': email, 'password': password}, expected=(201,))
    body, _ = request('/api/auth/login', data={'email': email, 'password': password})
    token = json.loads(body)['token']
    request('/api/me/context', token=token)
    request('/api/produtor', token=token, expected=(201,), data={
        'nomeCompleto': 'Teste Docker', 'cpfOrCnpj': unique,
        'dataNascimento': '1990-01-01', 'telefone': '18999990000',
    })
    body, _ = request('/api/fazenda', token=token, expected=(201,), data={
        'nome': 'Fazenda Teste Docker', 'cidade': 'Aracatuba', 'estado': 'SP',
        'areaTotalHa': 100.0, 'exploracao': 'ENGORDA',
        'latitude': -21.2, 'longitude': -50.4,
    })
    farm_id = json.loads(body)['id']
    invited = f'convite-{unique}@example.invalid'
    request('/api/funcionarios/convites', token=token, expected=(201,), data={
        'email': invited, 'fazendaId': farm_id, 'cargo': 'TRATADOR',
    })
    # SMTP e assincrono: aguarda apenas a mensagem criada por este teste.
    for attempt in range(15):
        messages, _ = request('/api/v1/messages', base=args.mailpit)
        if invited in messages:
            break
        time.sleep(1)
    else:
        raise AssertionError('Convite nao chegou ao Mailpit')
    print('Cadastro, login, autorizacao, produtor, fazenda e convite SMTP: OK')

print('SPA, configuracao em runtime, proxy da API e Mailpit: OK')
