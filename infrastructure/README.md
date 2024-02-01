# Pulumi

The IaC tool used in the project was `Pulumi`. No particular reason here, I only wanted to give it a try and experiment with the tool.

### Running it locally

Make sure you have installed:
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [Pulumi](https://www.pulumi.com/)
- [Node](https://nodejs.org/en)

1) Clone this repository
```sh
git clone git@github.com:felipelaptrin/felipetrindade.com.git
```

2) cd into the `infrastructure` folder
```sh
cd infrastructure
```

3) Install dependencies
```sh
npm install
```

4) Setup provider
```sh
pulumi login <S3_URI>
```
