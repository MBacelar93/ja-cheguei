import bcryptjs from 'bcryptjs';

async function gerarHash() {
    const hash = await bcryptjs.hash('123456', 10);
    console.log('Hash de "123456":');
    console.log(hash);
}

gerarHash();