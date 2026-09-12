export type TipoReuniao = 
  | 'ordinaria' 
  | 'extraordinaria' 
  | 'assembleia' 
  | 'conselho' 
  | 'planejamento' 
  | 'alinhamento_projeto' 
  | 'diretoria';

export type StatusReuniao = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';

export type ModalidadeReuniao = 'presencial' | 'online' | 'hibrida';

export interface TopicoPauta {
  id: string;
  titulo: string;
  descricao?: string;
  tempo_estimado_min?: number;
  responsavel?: string;
  deliberacao?: string;
  concluido?: boolean;
}

export interface EncaminhamentoReuniao {
  id: string;
  descricao: string;
  responsavel: string;
  prazo?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
}

export interface ProjetoResumo {
  id: string;
  nome: string;
  cor_identificacao?: string;
  icone?: string;
}

export interface RessalvaAta {
  id: string;
  data_hora: string;
  autor: string;
  autor_nome?: string;
  texto: string;
}

export interface Reuniao {
  id?: string;
  titulo: string;
  data_hora: string;
  horario_fim?: string;
  duracao_estimada_min?: number;
  tipo: TipoReuniao;
  modalidade: ModalidadeReuniao;
  local_reuniao: string;
  link_virtual?: string;
  pauta: string;
  pautas_topicos: TopicoPauta[];
  ata: string;
  deliberacoes?: string;
  encaminhamentos: EncaminhamentoReuniao[];
  participantes: string[];
  presentes: string[];
  ausentes: string[];
  secretario?: string;
  secretario_id?: string;
  presidente?: string;
  status: StatusReuniao;
  projeto_id?: string | null;
  projeto?: ProjetoResumo;
  created_by?: string | null;
  created_by_name?: string;
  ressalvas?: RessalvaAta[];
  created_at?: string;
  updated_at?: string;
}
