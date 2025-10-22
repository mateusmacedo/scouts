# Biome

O Biome é um projeto recente, ele nasceu com o intuito de ser uma reescrita do Prettier em Rust. Ele se diz 35x mais rápido que o Prettier e tem a mesma saída. Além do formatador, o Biome também tem um linter embutido.

#### Instalação

Para instalar o Biome com o npm, rode:

```bash
npm install --save-dev --save-exact @biomejs/biome
```

#### Configuração

O Biome pode ser configurado usando um arquivo `biome.json` na raiz do seu projeto. Aqui está um exemplo de um arquivo de configuração simples:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.6.1/schema.json",
  "organizeImports": {
    "enabled": false
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

#### Formatação

Depois de instalar e configurar o Biome, você pode executá-lo em seu código usando o seguinte comando:

```bash
npx @biomejs/biome format <files> --write
```

Isso formatará todos os arquivos no diretório atual de acordo com as regras definidas no arquivo `biome.json`.

#### Linting

Depois de instalar e configurar o Biome, você pode executá-lo em seu código usando o seguinte comando:

```bash
npx @biomejs/biome lint <files>
```

Isso executará o Biome em todos os arquivos no diretório atual e exibirá quaisquer problemas que encontrar.

