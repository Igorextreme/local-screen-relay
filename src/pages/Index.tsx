
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Monitor, Eye, Wifi } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Transmissão de Tela Local
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de compartilhamento de tela em tempo real para rede local. 
            Transmita sua tela e permita que outros visualizem instantaneamente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Monitor className="w-8 h-8 text-blue-600" />
                Transmitir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Inicie uma transmissão da sua tela. Outras pessoas na rede local 
                poderão visualizar em tempo real.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Captura de tela em alta qualidade
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Ajuste automático de FPS
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Preview em tempo real
                </div>
              </div>
              <Link to="/transmitter">
                <Button className="w-full" size="lg">
                  Começar Transmissão
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Eye className="w-8 h-8 text-green-600" />
                Visualizar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Conecte-se para visualizar uma transmissão ativa. 
                Suporte a tela cheia e controles intuitivos.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Visualização em tempo real
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Modo tela cheia
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Conexão automática
                </div>
              </div>
              <Link to="/viewer">
                <Button variant="outline" className="w-full" size="lg">
                  Visualizar Transmissão
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Como usar:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <p>Inicie o servidor backend na porta 3000</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <p>Use "Transmitir" para compartilhar sua tela</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
              <p>Outros usuários podem "Visualizar" a transmissão</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
